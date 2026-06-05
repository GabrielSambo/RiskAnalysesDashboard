import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessageComponent } from '@components/shared/chat-message/chat-message.component';
import { ChatInputComponent } from '@components/shared/chat-input/chat-input.component';
import { ChatService } from '@services/chat.service';
import { ToastService } from '@services/toast.service';
import { ChatMessage, HistoryMessage } from '@models/chat.model';

const WELCOME_MESSAGE =
  "Welcome! I'm **Maestro**, your assistant for answering questions related " +
  'to the documents you uploaded.\n\nReady to get started?';

@Component({
  selector: 'app-chat',
  imports: [
    CommonModule,
    ChatMessageComponent,
    ChatInputComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  messages: ChatMessage[] = [
    { role: 'assistant', content: WELCOME_MESSAGE, timestamp: new Date() },
  ];

  isLoading = false;
  private shouldScroll = false;

  constructor(
    private chatService: ChatService,
    private toastService: ToastService
  ) {}

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.shouldScroll = false;
      // Delay to ensure DOM is fully rendered after change detection
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  onSendMessage(question: string): void {
    this.messages.push({ role: 'user', content: question, timestamp: new Date() });
    this.isLoading = true;
    this.shouldScroll = true;

    // Build history from current messages (excluding the welcome message, only real exchanges)
    const history: HistoryMessage[] = this.messages
      .filter(m => m.content !== WELCOME_MESSAGE)
      .map(m => ({ role: m.role, content: m.content }));

    this.chatService.ask(question, history).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.messages.push({
          role: 'assistant',
          content: res.answer,
          timestamp: new Date(),
          resultType: res.result_type,
          rowCount: res.row_count,
          table: res.table ?? undefined,
        });
        this.shouldScroll = true;
      },
      error: (err) => {
        this.isLoading = false;
        const detail = err?.error?.detail || 'Something went wrong. Please try again.';
        this.toastService.error(detail);
        this.messages.push({
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your question. Please try again.',
          timestamp: new Date(),
        });
        this.shouldScroll = true;
      },
    });
  }

  private scrollToBottom(): void {
    try {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    } catch (_) {}
  }
}
