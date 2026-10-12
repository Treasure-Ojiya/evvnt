import { Pipe, PipeTransform } from '@angular/core';

type DateFormat = 'full' | 'short' | 'numeric' | 'withTime';

@Pipe({
  name: 'dateFormat',
  standalone: true,
})
export class DatePipe implements PipeTransform {
  transform(
    date: string | Date | null | undefined,
    format: DateFormat = 'full',
  ): string {
    if (!date) {
      return '';
    }

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) {
      return '';
    }

    switch (format) {
      case 'full':
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(parsedDate);

      case 'short':
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(parsedDate);

      case 'numeric':
        return new Intl.DateTimeFormat('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(parsedDate);

      case 'withTime':
        return new Intl.DateTimeFormat('en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }).format(parsedDate);

      default:
        return '';
    }
  }
}
