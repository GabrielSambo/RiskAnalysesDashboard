import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '@models/chat.model';
import { MarkdownPipe } from '../../../pipes/markdown.pipe';

@Component({
  selector: 'app-chat-message',
  imports: [CommonModule, MarkdownPipe],
  templateUrl: './chat-message.component.html',
  styleUrls: ['./chat-message.component.scss'],
})
export class ChatMessageComponent {
  @Input() message!: ChatMessage;

  get timeAgo(): string {
    if (!this.message.timestamp) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - this.message.timestamp.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  }

  exportCsv(): void {
    if (!this.message.table) return;

    const { columns, rows } = this.message.table;
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = [
      columns.map(escape).join(','),
      ...rows.map((row) => columns.map((col) => escape(row[col] ?? '')).join(',')),
    ].join('\n');

    this.downloadFile(csv, 'text/csv;charset=utf-8;', 'chat-results.csv');
  }

  exportJson(): void {
    if (!this.message.table) return;
    this.downloadFile(
      JSON.stringify(this.message.table.rows, null, 2),
      'application/json;charset=utf-8;',
      'chat-results.json'
    );
  }

  private downloadFile(content: string, mimeType: string, fileName: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}
