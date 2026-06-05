import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/** Definition for each column in an editable table. */
export interface TableColumnDef {
  key: string;
  header: string;
  type: 'text' | 'select' | 'multi-select';
  /** Static options for 'select' and 'multi-select' type columns. */
  options?: string[];
  /** Dynamic options resolver — takes the current row, returns option list. Overrides `options` when present. */
  optionsFn?: (row: Record<string, string>) => string[];
  /** If true, cell is read-only. */
  readonly?: boolean;
}

@Component({
  selector: 'app-editable-table',
  imports: [CommonModule, FormsModule],
  templateUrl: './editable-table.component.html',
  styleUrls: ['./editable-table.component.scss'],
})
export class EditableTableComponent implements OnChanges {
  @Input() title = '';
  @Input() columns: TableColumnDef[] = [];
  @Input() data: Record<string, string>[] = [];
  @Input() allowAdd = true;
  @Input() allowDelete = true;

  /** Emits the full updated data array on every change. */
  @Output() dataChange = new EventEmitter<Record<string, string>[]>();

  /** Internal mutable copy of the data so we don't mutate the parent's object. */
  rows: Record<string, string>[] = [];

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-wrapper')) {
      this.closeAllDropdowns();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.rows = (this.data || []).map((row) => ({ ...row }));
    }
  }

  onCellChange(): void {
    this.dataChange.emit(this.rows.map((r) => ({ ...r })));
  }

  addRow(): void {
    const empty: Record<string, string> = {};
    this.columns.forEach((col) => (empty[col.key] = ''));
    this.rows = [...this.rows, empty];
    this.onCellChange();
  }

  removeRow(index: number): void {
    this.rows = this.rows.filter((_, i) => i !== index);
    this.onCellChange();
  }

  /** Single-select: set value and close dropdown immediately. */
  selectSingle(row: Record<string, string>, key: string, value: string): void {
    row[key] = value;
    this.openDropdowns = {};
    this.onCellChange();
  }

  /** Toggle a value in a comma-separated multi-select cell. */
  toggleMultiSelect(row: Record<string, string>, key: string, option: string): void {
    const current = this.getMultiSelectValues(row, key);
    const idx = current.indexOf(option);
    if (idx >= 0) {
      current.splice(idx, 1);
    } else {
      current.push(option);
    }
    row[key] = current.join(', ');
    this.onCellChange();
  }

  /** Get options for a cell, supporting dynamic optionsFn. */
  getOptionsForCell(row: Record<string, string>, col: TableColumnDef): string[] {
    return col.optionsFn ? col.optionsFn(row) : (col.options || []);
  }

  /** Parse comma-separated values from a multi-select cell. */
  getMultiSelectValues(row: Record<string, string>, key: string): string[] {
    return (row[key] || '').split(',').map(v => v.trim()).filter(Boolean);
  }

  /** Track open/closed state for multi-select dropdowns. */
  openDropdowns: Record<string, boolean> = {};
  dropdownPositions: Record<string, { top: number; left: number; width: number }> = {};

  getDropdownKey(rowIndex: number, colKey: string): string {
    return `${rowIndex}_${colKey}`;
  }

  toggleDropdown(rowIndex: number, colKey: string, event: MouseEvent): void {
    const key = this.getDropdownKey(rowIndex, colKey);
    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    this.dropdownPositions[key] = {
      top: rect.bottom,
      left: rect.left,
      width: rect.width,
    };
    // Close all other dropdowns
    for (const k of Object.keys(this.openDropdowns)) {
      if (k !== key) this.openDropdowns[k] = false;
    }
    this.openDropdowns[key] = !this.openDropdowns[key];
  }

  isDropdownOpen(rowIndex: number, colKey: string): boolean {
    return !!this.openDropdowns[this.getDropdownKey(rowIndex, colKey)];
  }

  closeAllDropdowns(): void {
    this.openDropdowns = {};
  }
}
