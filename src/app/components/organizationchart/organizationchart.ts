import {NgModule,Component,ElementRef,Input,Output,OnInit,AfterContentInit,OnDestroy,EventEmitter,TemplateRef,EmbeddedViewRef,ViewContainerRef,
        Inject,forwardRef,ContentChildren,QueryList} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DomHandler} from '../dom/domhandler';
import {SharedModule} from '../common/shared';
import {TreeNode} from '../common/treenode';
import {PrimeTemplate} from '../common/shared';

@Component({
    selector: 'p-organizationChartNodeTemplateLoader',
    template: ``
})
export class OrganizationChartNodeTemplateLoader implements OnInit, OnDestroy {
        
    @Input() node: any;
    
    @Input() template: TemplateRef<any>;
    
    view: EmbeddedViewRef<any>;
        
    constructor(public viewContainer: ViewContainerRef) {}
    
    ngOnInit() {
        this.view = this.viewContainer.createEmbeddedView(this.template, {
            '\$implicit': this.node
        });
    }
    
    ngOnDestroy() {
        this.view.destroy();
    }
}

@Component({
    selector: '[pOrganizationChartNode]',
    template: `
        <tr>
            <td [attr.colspan]="colspan">
                <div class="ui-organizationchart-node-content ui-widget-content ui-corner-all {{node.styleClass}}" 
                    [ngClass]="{'ui-organizationchart-selectable-node': chart.selectionMode && node.selectable !== false,'ui-state-highlight':isSelected()}"
                    (click)="onNodeClick($event,node)">
                    <div *ngIf="!chart.getTemplateForNode(node)">{{node.label}}</div>
                    <div *ngIf="chart.getTemplateForNode(node)">
                        <p-organizationChartNodeTemplateLoader [node]="node" [template]="chart.getTemplateForNode(node)"></p-organizationChartNodeTemplateLoader>
                    </div>
                    <a *ngIf="!leaf" href="#" class="ui-node-toggler" (click)="toggleNode($event, node)">
                        <i class="fa ui-node-toggler-icon" [ngClass]="{'fa-chevron-down': node.expanded, 'fa-chevron-up': !node.expanded}"></i>
                    </a>
                </div>
            </td>
        </tr>
        <tr *ngIf="!leaf&&node.expanded" class="ui-organizationchart-lines">
            <td [attr.colspan]="colspan">
                <div class="ui-organizationchart-line-down"></div>
            </td>
        </tr>
        <tr *ngIf="!leaf&&node.expanded" class="ui-organizationchart-lines">
            <ng-template ngFor let-child [ngForOf]="node.children" let-first="first" let-last="last">
                <td class="ui-organizationchart-line-left" [ngClass]="{'ui-organizationchart-line-top':!first}">&nbsp;</td>
                <td class="ui-organizationchart-line-right" [ngClass]="{'ui-organizationchart-line-top':!last}">&nbsp;</td>
            </ng-template>
        </tr>
        <tr *ngIf="!leaf&&node.expanded" class="ui-organizationchart-nodes">
            <td *ngFor="let child of node.children" colspan="2">
                <table class="ui-organizationchart-table" pOrganizationChartNode [node]="child"></table>
            </td>
        </tr>
    `
})
export class OrganizationChartNode {

    @Input() node: TreeNode;
        
    @Input() root: boolean;
    
    @Input() first: boolean;
    
    @Input() last: boolean;
        
    constructor(@Inject(forwardRef(() => OrganizationChart)) public chart:OrganizationChart) {}
                
    get leaf(): boolean {
        return this.node.leaf == false ? false : !(this.node.children&&this.node.children.length);
    }
    
    get colspan() {
        return (this.node.children && this.node.children.length) ? this.node.children.length * 2: null;
    }
    
    onNodeClick(event: Event, node: TreeNode) {
        this.chart.onNodeClick(event, node)
    }
    
    toggleNode(event: Event, node: TreeNode) {
        node.expanded = !node.expanded;
        event.preventDefault();
    }
    
    isSelected() {
        return this.chart.isSelected(this.node);
    }
}

@Component({
    selector: 'p-organizationChart',
    template: `
        <div [ngStyle]="style" [class]="styleClass" [ngClass]="'ui-organizationchart ui-widget'">
            <table class="ui-organizationchart-table" pOrganizationChartNode [node]="root"></table>
        </div>
    `,
    providers: [DomHandler]
})
export class OrganizationChart implements AfterContentInit {
            
    @Input() value: TreeNode[];            

    @Input() style: any;

    @Input() styleClass: string;
    
    @Input() selectionMode: string;
    
    @Input() selection: any;
    
    @Output() selectionChange: EventEmitter<any> = new EventEmitter();
    
    @Output() onNodeSelect: EventEmitter<any> = new EventEmitter();
    
    @Output() onNodeUnselect: EventEmitter<any> = new EventEmitter();
    
    @ContentChildren(PrimeTemplate) templates: QueryList<any>;
    
    public templateMap: any;
    
    constructor(public el: ElementRef, public domHandler: DomHandler) {}
    
    get root(): TreeNode {
        return this.value && this.value.length ? this.value[0] : null;
    }
    
    ngAfterContentInit() {
        if(this.templates.length) {
            this.templateMap = {};
        }
        
        this.templates.forEach((item) => {
            this.templateMap[item.getType()] = item.template;
        });
    }
    
    getTemplateForNode(node: TreeNode): TemplateRef<any> {
        if(this.templateMap)
            return node.type ? this.templateMap[node.type] : this.templateMap['default'];
        else
            return null;
    }
    
    onNodeClick(event: Event, node: TreeNode) {
        let eventTarget = (<Element> event.target);
        
        if(eventTarget.className && (eventTarget.className.indexOf('ui-node-toggler') !== -1 || eventTarget.className.indexOf('ui-node-toggler-icon') !== -1)) {
            return;
        }
        else if(this.selectionMode) {
            if(node.selectable === false) {
                return;
            }
            
            let index = this.findIndexInSelection(node);
            let selected = (index >= 0);
            
            if(this.selectionMode === 'single') {
                if(selected) {
                    this.selection = null;
                    this.onNodeUnselect.emit({originalEvent: event, node: node});
                }
                else {
                    this.selection = node;
                    this.onNodeSelect.emit({originalEvent: event, node: node});
                }
            }
            else if(this.selectionMode === 'multiple') {
                if(selected) {
                    this.selection = this.selection.filter((val,i) => i!=index);
                    this.onNodeUnselect.emit({originalEvent: event, node: node});
                }
                else {
                    this.selection = [...this.selection||[],node];
                    this.onNodeSelect.emit({originalEvent: event, node: node});
                }
            }
            
            this.selectionChange.emit(this.selection);
        }
    }
    
    findIndexInSelection(node: TreeNode) {
        let index: number = -1;

        if(this.selectionMode && this.selection) {
            if(this.selectionMode === 'single') {
                index = (this.selection == node) ? 0 : - 1;
            }
            else if(this.selectionMode === 'multiple') {
                for(let i = 0; i  < this.selection.length; i++) {
                    if(this.selection[i] == node) {
                        index = i;
                        break;
                    }
                }
            }
        }

        return index;
    }
    
    isSelected(node: TreeNode) {
        return this.findIndexInSelection(node) != -1;         
    }
}

@NgModule({
    imports: [CommonModule],
    exports: [OrganizationChart,SharedModule],
    declarations: [OrganizationChart,OrganizationChartNode,OrganizationChartNodeTemplateLoader]
})
export class OrganizationChartModule { }