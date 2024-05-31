import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TextFieldModule } from '@angular/cdk/text-field';
import { DataService } from './services/data.service';
import { HttpClient } from '@angular/common/http';

const FUNCTION_ENDPOINT = "http://localhost:7071/api/Submit";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatInputModule,
    MatSnackBarModule,
    TextFieldModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(
    private readonly dataService: DataService,
    private readonly snackBar: MatSnackBar,
    private readonly client: HttpClient
  ) { }

  public title: string = 'Neudesic ClientCrypt';

  @Input()
  public message?: string;

  public get size(): number {
    return (this.message?.replace(/\s+/g, '').length ?? 0) * 1.33 / 1024;
  }

  public async save(): Promise<void> {
    var id = await this.dataService.saveMessage(JSON.parse(this.message ?? ''));
    this.message = '';
    this.displayMessage(`Message saved as "${id}"`);
  }

  public transmit(): void {
    const messages = this.dataService.getMessages();
    for (const id in messages) {
      this.client.post(FUNCTION_ENDPOINT, messages[id]).subscribe();
    }
    this.dataService.clearMessages();
    this.displayMessage('Messages transmitted');
  }

  private displayMessage(message: string): void {
    this.snackBar.open(message, '❌', {
      duration: 3500
    });
  }
}

