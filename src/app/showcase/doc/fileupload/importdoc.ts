import { Component, Input } from '@angular/core';
import { Code } from '../../domain/code';

@Component({
    selector: 'file-upload-import-doc',
    template: ` <div>
        <app-docsectiontext [title]="title" [id]="id"></app-docsectiontext>
        <app-code [code]="code" [hideToggleCode]="true"></app-code>
    </div>`
})
export class ImportDoc {
    @Input() id: string;

    @Input() title: string;

    code: Code = {
        basic: `
import { FileUploadModule } from 'primeng/fileupload';`
    };
}