// The calendar button on the recipe detail page: opens a sheet with Montag to Sonntag. Each day
// is a link to the .ics route for the next such weekday, which the phone offers to add to its
// calendar (docs/decisions/0013-weekly-menu-calendar.md).
// The days are worked out when the sheet opens, in the phone's time zone: the server can't know
// it, and a page left open overnight stays right.
import { useState } from 'preact/hooks';
import { weekDays, type WeekDay } from '../lib/recipes/week-days.ts';
import BottomSheet from './BottomSheet.tsx';
import Icon from './Icon.tsx';
import styles from './CalendarButton.module.css';
import { TEXT } from './CalendarButton.texts.ts';

type Props = {
  recipeId: string;
};

export default function CalendarButton({ recipeId }: Props) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<WeekDay[]>([]);

  function openSheet() {
    setDays(weekDays(new Date()));
    setOpen(true);
  }

  return (
    <>
      <button type="button" class={styles.button} aria-label={TEXT.open} onClick={openSheet}>
        <Icon name="calendar" size={21} strokeWidth={2.2} />
      </button>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={TEXT.title}>
        <ul class={styles.days}>
          {days.map((day) => (
            <li key={day.date}>
              <a class={styles.day} href={`/recipes/${recipeId}/calendar.ics?date=${day.date}`}>
                <span class={styles.name}>{day.name}</span>
                <span class={styles.date}>{day.shortDate}</span>
                <Icon name="plus" size={18} strokeWidth={2.4} />
              </a>
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}
