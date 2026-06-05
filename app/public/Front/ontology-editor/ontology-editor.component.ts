import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import * as d3 from 'd3';
import { SpinnerComponent } from '@components/shared/spinner/spinner.component';
import { PageHeaderComponent } from '@components/shared/page-header/page-header.component';
import { FooterComponent } from '@components/shared/footer/footer.component';
import {
  EditableTableComponent,
  TableColumnDef,
} from '@components/shared/editable-table/editable-table.component';
import { OntologyService } from '@services/ontology.service';
import { ToastService } from '@services/toast.service';
import {
  Ontology,
  OntologyResponse,
  OntologyNode,
  OntologyRelationship,
  OntologyConnection,
  OntologyAttribute,
  ValidationResult,
} from '@models/ontology.model';

interface SchemaNode extends d3.SimulationNodeDatum {
  id: string;
}
interface SchemaLink extends d3.SimulationLinkDatum<SchemaNode> {
  label: string;
  index?: number;
  total?: number;
}

@Component({
  selector: 'app-ontology-editor',
  imports: [
    CommonModule,
    FormsModule,
    SpinnerComponent,
    PageHeaderComponent,
    FooterComponent,
    EditableTableComponent,
  ],
  templateUrl: './ontology-editor.component.html',
  styleUrls: ['./ontology-editor.component.scss'],
})
export class OntologyEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('schemaSvg', { static: true }) schemaSvgRef!: ElementRef<SVGSVGElement>;
  @ViewChild('editorLeft', { static: true }) editorLeftRef!: ElementRef<HTMLDivElement>;

  sessionId = '';
  isLoading = false;
  spinnerMessage = '';
  clearFirst = false;

  // Resizer state
  leftWidthPct = 48;
  private isResizing = false;
  private containerWidth = 0;

  private simulation: d3.Simulation<SchemaNode, SchemaLink> | null = null;

  // EY-dark palette for node types
  private readonly PALETTE = [
    '#ffe600','#2e86ab','#a23b72','#f18f01','#c73e1d',
    '#3b1f2b','#44bba4','#e94f37','#393e41','#6b4226',
  ];
  private colorMap = new Map<string, string>();

  /** All column names from the uploaded files — used for smart column selects. */
  private allColumns: string[] = [];

  /** Unique sample values per column — used for the filter_value dynamic dropdown. */
  private columnSampleValues: Record<string, string[]> = {};

  // --- Table 1: Nodes ---
  nodesColumns: TableColumnDef[] = [
    { key: 'name', header: 'Node', type: 'text' },
    { key: 'columns', header: 'Columns', type: 'multi-select', options: [] },
    { key: 'filter_column', header: 'Filter column', type: 'select', options: [] },
    { key: 'filter_value', header: 'Keep value', type: 'select',
      optionsFn: (row) => this.columnSampleValues[row['filter_column']] || [] },
  ];
  nodesData: Record<string, string>[] = [];

  // --- Table 2: Relationships ---
  relsColumns: TableColumnDef[] = [
    { key: 'name', header: 'Relationship', type: 'text' },
    { key: 'columns', header: 'Columns', type: 'multi-select', options: [] },
  ];
  relsData: Record<string, string>[] = [];

  // --- Table 3: Connections ---
  connColumns: TableColumnDef[] = [
    { key: 'relationship', header: 'Relationship', type: 'text' },
    { key: 'sourceNode', header: 'Origin Node', type: 'select', options: [] },
    { key: 'targetNode', header: 'Destination Node', type: 'select', options: [] },
    { key: 'sourceColumn', header: 'Source Column', type: 'select', options: [] },
    { key: 'targetColumn', header: 'Target Column', type: 'select', options: [] },
  ];
  connData: Record<string, string>[] = [];

  // --- Table 4: Attributes ---
  attrColumns: TableColumnDef[] = [
    { key: 'name', header: 'Attribute', type: 'text' },
    { key: 'column', header: 'Column', type: 'select', options: [] },
    { key: 'entityName', header: 'Entity', type: 'text' },
    { key: 'entityType', header: 'Type', type: 'select', options: ['node', 'relationship'] },
  ];
  attrData: Record<string, string>[] = [];

  constructor(
    private ontologyService: OntologyService,
    private toastService: ToastService,
    private router: Router,
    private zone: NgZone,
  ) {}

  ngAfterViewInit(): void {
    this.renderSchema();
  }

  ngOnDestroy(): void {
    this.simulation?.stop();
  }

  // ── Resizer drag ──────────────────────────────────────
  startResize(event: MouseEvent): void {
    this.isResizing = true;
    const body = (event.target as HTMLElement).closest('.editor-body') as HTMLElement;
    this.containerWidth = body?.clientWidth ?? window.innerWidth;
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    const left = this.editorLeftRef.nativeElement.getBoundingClientRect().left;
    const newPct = ((event.clientX - left) / this.containerWidth) * 100;
    this.leftWidthPct = Math.min(80, Math.max(20, newPct));
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    if (this.isResizing) {
      this.isResizing = false;
      // Redraw schema since SVG dimensions changed
      setTimeout(() => this.renderSchema(), 50);
    }
  }

  ngOnInit(): void {
    const raw = sessionStorage.getItem('ontologyResponse');
    if (!raw) {
      this.toastService.warning('No ontology data found. Please upload files first.');
      this.router.navigate(['/upload']);
      return;
    }

    const response: OntologyResponse = JSON.parse(raw);
    this.sessionId = response.sessionId;

    // Extract all column names and their sample values from the file summary
    const colSet = new Set<string>();
    response.fileSummary?.files?.forEach(f =>
      f.sheets?.forEach(s =>
        s.columns?.forEach(c => {
          colSet.add(c.name);
          this.columnSampleValues[c.name] = c.sample_values || [];
        })
      )
    );
    this.allColumns = Array.from(colSet).sort();

    this.hydrateTables(response.ontology);
    this.updateColumnSelects();
  }

  // --- Table data change handlers ---

  onNodesChange(data: Record<string, string>[]): void {
    this.nodesData = data;
    this.updateColumnSelects();
    this.renderSchema();
  }

  onRelsChange(data: Record<string, string>[]): void {
    this.relsData = data;
    this.renderSchema();
  }

  onConnChange(data: Record<string, string>[]): void {
    this.connData = data;
    this.renderSchema();
  }

  onAttrChange(data: Record<string, string>[]): void {
    this.attrData = data;
  }

  // --- Confirm ---

  confirmOntology(): void {
    const ontology = this.buildOntology();

    this.isLoading = true;
    this.spinnerMessage = this.clearFirst
      ? 'Clearing existing graph & creating new Knowledge Graph…'
      : 'Validating & creating Knowledge Graph in Neo4j…';

    this.ontologyService.createKnowledgeGraph(this.sessionId, ontology, this.clearFirst).subscribe({
      next: (kgResult) => {
        this.isLoading = false;
        if (kgResult.success) {
          kgResult.warnings?.forEach((w: string) => this.toastService.warning(w, 8000));
          this.toastService.success(
            `Knowledge Graph created: ${kgResult.nodesCreated} nodes, ` +
            `${kgResult.relationshipsCreated} relationships.`
          );
          this.router.navigate(['/graph-explorer']);
        } else {
          this.toastService.error(kgResult.message, 0);
        }
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.detail;
        if (typeof detail === 'string' && detail.startsWith('Ontology validation failed')) {
          // Backend returned validation errors — show each one
          const errors = detail.replace('Ontology validation failed: ', '').split('; ');
          errors.forEach((e: string) => this.toastService.error(e, 10000));
        } else {
          this.toastService.error(detail || 'Failed to create the Knowledge Graph.', 0);
        }
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/upload']);
  }

  // --- Schema rendering ---

  renderSchema(): void {
    this.zone.runOutsideAngular(() => {
      const svgEl = this.schemaSvgRef?.nativeElement;
      if (!svgEl) return;

      const width  = svgEl.clientWidth  || 500;
      const height = svgEl.clientHeight || 500;

      // Build nodes (unique entity types)
      const nodeNames = Array.from(
        new Set(this.nodesData.map(n => n['name']).filter(Boolean))
      );

      // Assign colours
      nodeNames.forEach((name, i) => {
        if (!this.colorMap.has(name)) {
          this.colorMap.set(name, this.PALETTE[i % this.PALETTE.length]);
        }
      });

      // Prune colors no longer in use
      for (const key of this.colorMap.keys()) {
        if (!nodeNames.includes(key)) this.colorMap.delete(key);
      }

      // Build links from connections table
      const rawLinks: { source: string; target: string; label: string }[] = [];
      this.connData.forEach(c => {
        const s = c['sourceNode'], t = c['targetNode'], l = c['relationship'];
        if (s && t && l) rawLinks.push({ source: s, target: t, label: l });
      });

      // Assign parallel-edge indices
      const pairCount = new Map<string, number>();
      rawLinks.forEach(l => {
        const key = [l.source, l.target].sort().join('||');
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1);
      });
      const pairCursor = new Map<string, number>();
      const links: SchemaLink[] = rawLinks.map(l => {
        const key = [l.source, l.target].sort().join('||');
        const total = pairCount.get(key)!;
        const idx   = pairCursor.get(key) ?? 0;
        pairCursor.set(key, idx + 1);
        return { source: l.source, target: l.target, label: l.label, index: idx, total };
      });

      const nodes: SchemaNode[] = nodeNames.map(name => {
        // Re-use existing node positions if already simulated
        const existing = (this.simulation?.nodes() ?? []).find(n => n.id === name);
        return { id: name, x: existing?.x, y: existing?.y };
      });

      // Clear & rebuild SVG
      const svg = d3.select(svgEl);
      svg.selectAll('*').remove();
      svg.attr('width', width).attr('height', height);

      // Arrow marker (refX=0 since paths already end at node border)
      svg.append('defs').append('marker')
        .attr('id', 'schema-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 8)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', 'rgba(255,255,255,0.35)');

      const gLinks = svg.append('g').attr('class', 'links');
      const gLabels = svg.append('g').attr('class', 'edge-labels');
      const gNodes = svg.append('g').attr('class', 'nodes');

      // Links (curved paths for parallel edges)
      const linkSel = gLinks.selectAll<SVGPathElement, SchemaLink>('path')
        .data(links)
        .join('path')
        .attr('fill', 'none')
        .attr('stroke', 'rgba(255,255,255,0.28)')
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#schema-arrow)');

      // Edge labels — group: background rect + text
      const edgeLabelSel = gLabels.selectAll<SVGGElement, SchemaLink>('g')
        .data(links)
        .join('g');

      edgeLabelSel.append('rect')
        .attr('rx', 3)
        .attr('ry', 3)
        .attr('fill', 'rgba(20,20,32,0.82)');

      edgeLabelSel.append('text')
        .attr('fill', 'rgba(255,255,255,0.75)')
        .attr('font-size', '9px')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .text(l => l.label);

      // Size the background rect after text is in DOM
      edgeLabelSel.each(function() {
        const g = d3.select(this);
        const txt = g.select('text').node() as SVGTextElement | null;
        if (!txt) return;
        const bb = txt.getBBox();
        g.select('rect')
          .attr('x', bb.x - 3).attr('y', bb.y - 2)
          .attr('width', bb.width + 6).attr('height', bb.height + 4);
      });

      // Helpers to get label group position
      const labelX = (d: SchemaLink): number => {
        const s = d.source as SchemaNode, t = d.target as SchemaNode;
        const sx = s.x ?? 0, sy = s.y ?? 0, tx = t.x ?? 0, ty = t.y ?? 0;
        if (s.id === t.id) return sx + NODE_R + 28;
        const offset = ((d.index ?? 0) - ((d.total ?? 1) - 1) / 2) * 30;
        const dx = tx - sx, dy = ty - sy, len = Math.sqrt(dx*dx + dy*dy) || 1;
        return (sx + tx) / 2 - (dy / len) * offset;
      };
      const labelY = (d: SchemaLink): number => {
        const s = d.source as SchemaNode, t = d.target as SchemaNode;
        const sx = s.x ?? 0, sy = s.y ?? 0, tx = t.x ?? 0, ty = t.y ?? 0;
        if (s.id === t.id) return sy;
        const offset = ((d.index ?? 0) - ((d.total ?? 1) - 1) / 2) * 30;
        const dx = tx - sx, dy = ty - sy, len = Math.sqrt(dx*dx + dy*dy) || 1;
        return (sy + ty) / 2 + (dx / len) * offset;
      };

      // Node circles
      const nodeSel = gNodes.selectAll<SVGGElement, SchemaNode>('g')
        .data(nodes, d => d.id)
        .join('g')
        .call(
          d3.drag<SVGGElement, SchemaNode>()
            .on('start', (event, d) => {
              if (!event.active) this.simulation?.alphaTarget(0.3).restart();
              d.fx = d.x; d.fy = d.y;
            })
            .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on('end', (event, d) => {
              if (!event.active) this.simulation?.alphaTarget(0);
              d.fx = null; d.fy = null;
            })
        );

      nodeSel.append('circle')
        .attr('r', 28)
        .attr('fill', d => this.colorMap.get(d.id) ?? '#444')
        .attr('fill-opacity', 0.18)
        .attr('stroke', d => this.colorMap.get(d.id) ?? '#444')
        .attr('stroke-width', 2);

      nodeSel.append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', d => this.colorMap.get(d.id) ?? '#fff')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(d => d.id);

      // Helper: curved path for edge
      const NODE_R = 28;
      const linkPath = (d: SchemaLink): string => {
        const s = d.source as SchemaNode;
        const t = d.target as SchemaNode;
        const sx = s.x ?? 0, sy = s.y ?? 0;
        const tx = t.x ?? 0, ty = t.y ?? 0;

        // Self-loop: small oval attached to the right side of the node (Neo4j-style)
        if (s.id === (typeof t === 'string' ? t : (t as SchemaNode).id)) {
          // Start slightly above the right border, arc clockwise (large), end slightly below
          const ex1 = sx + NODE_R, ey1 = sy - 6;
          const ex2 = sx + NODE_R, ey2 = sy + 6;
          return `M${ex1},${ey1} A 22,16 0 1 1 ${ex2},${ey2}`;
        }

        // Direction unit vector
        const dx = tx - sx, dy = ty - sy;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        // Offset entry/exit points to node border
        const startX = sx + (dx / len) * NODE_R;
        const startY = sy + (dy / len) * NODE_R;
        const endX   = tx - (dx / len) * NODE_R;
        const endY   = ty - (dy / len) * NODE_R;

        // Parallel edge offset (perpendicular)
        const offset = ((d.index ?? 0) - ((d.total ?? 1) - 1) / 2) * 30;
        const cx = (startX + endX) / 2 - (dy / len) * offset;
        const cy = (startY + endY) / 2 + (dx / len) * offset;
        return `M${startX},${startY} Q${cx},${cy} ${endX},${endY}`;
      };

      // Simulation
      this.simulation?.stop();
      this.simulation = d3.forceSimulation<SchemaNode>(nodes)
        .force('link', d3.forceLink<SchemaNode, SchemaLink>(links)
          .id(d => d.id)
          .distance(130)
        )
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide(45))
        .on('tick', () => {
          linkSel.attr('d', linkPath);
          edgeLabelSel.attr('transform', d => `translate(${labelX(d)},${labelY(d)})`);
          nodeSel.attr('transform', d => `translate(${d.x ?? 0},${d.y ?? 0})`);
        });
    });
  }

  // --- Private helpers ---

  private hydrateTables(ontology: Ontology): void {
    this.nodesData = ontology.nodes.map((n: OntologyNode) => ({
      name: n.name,
      columns: n.columns,
      filter_column: n.filter_column ?? '',
      filter_value: n.filter_value ?? '',
    }));

    this.relsData = ontology.relationships.map((r: OntologyRelationship) => ({
      name: r.name,
      columns: r.columns,
    }));

    this.connData = ontology.connections.map((c: OntologyConnection) => ({
      relationship: c.relationship,
      sourceNode: c.sourceNode,
      targetNode: c.targetNode,
      sourceColumn: c.sourceColumn ?? '',
      targetColumn: c.targetColumn ?? '',
    }));

    this.attrData = ontology.attributes.map((a: OntologyAttribute) => ({
      name: a.name,
      column: a.column,
      entityName: a.entityName,
      entityType: a.entityType,
    }));

    this.updateColumnSelects();
  }

  /** Keep dynamic column options in sync across all tables. */
  private updateColumnSelects(): void {
    const nodeNames = this.nodesData.map((n) => n['name']).filter(Boolean);
    const cols = this.allColumns;

    this.nodesColumns = this.nodesColumns.map((col) => {
      if (col.key === 'columns') return { ...col, options: cols };
      if (col.key === 'filter_column') return { ...col, options: ['', ...cols] };
      return col;
    });

    this.relsColumns = this.relsColumns.map((col) => {
      if (col.key === 'columns') return { ...col, options: cols };
      return col;
    });

    this.connColumns = this.connColumns.map((col) => {
      if (col.key === 'sourceNode' || col.key === 'targetNode') return { ...col, options: nodeNames };
      if (col.key === 'sourceColumn' || col.key === 'targetColumn') return { ...col, options: cols };
      return col;
    });

    this.attrColumns = this.attrColumns.map((col) => {
      if (col.key === 'column') return { ...col, options: cols };
      return col;
    });
  }

  private buildOntology(): Ontology {
    return {
      nodes: this.nodesData.map((r) => ({
        name: r['name'],
        columns: r['columns'],
        filter_column: r['filter_column'] ?? '',
        filter_value: r['filter_value'] ?? '',
      })),
      relationships: this.relsData.map((r) => ({
        name: r['name'],
        columns: r['columns'],
      })),
      connections: this.connData.map((r) => ({
        relationship: r['relationship'],
        sourceNode: r['sourceNode'],
        targetNode: r['targetNode'],
        sourceColumn: r['sourceColumn'] ?? '',
        targetColumn: r['targetColumn'] ?? '',
      })),
      attributes: this.attrData.map((r) => ({
        name: r['name'],
        column: r['column'],
        entityName: r['entityName'],
        entityType: r['entityType'] as 'node' | 'relationship',
      })),
    };
  }
}
