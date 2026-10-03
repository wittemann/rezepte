// Edit and new recipe form (design/README.md, "7. Rezept bearbeiten / neu"). A plain
// <form method="post"> to its own page, so it works without JS and the page can show it again
// with the typed values when something is wrong. JS only disables "Sichern" while the name is
// empty (without JS, `required` stops the submit instead). Only the name is controlled; the other
// fields use default values, so re-rendering on typing the name never resets them.
import type { ComponentChildren } from 'preact';
import { useEffect, useState } from 'preact/hooks';
import { CATEGORIES, MEALS, SOURCES } from '../lib/recipes/fields.ts';
import type { RecipeFormField, RecipeFormValues } from '../lib/recipes/form.ts';
import styles from './RecipeForm.module.css';
import { TEXT } from './RecipeForm.texts.ts';

type Props = {
  /** New recipe ("Neues Rezept") or changing one ("Bearbeiten") */
  isNew: boolean;
  values: RecipeFormValues;
  /** Fields the last submit couldn't save; they are marked with a message */
  invalidFields?: RecipeFormField[];
  /** The last submit failed for another reason (Airtable) */
  saveFailed?: boolean;
  /** Where "Abbrechen" leads; it goes back instead when that's the previous page (lib/navigation/back-links.ts) */
  cancelHref: string;
};

export default function RecipeForm({
  isNew,
  values,
  invalidFields = [],
  saveFailed = false,
  cancelHref,
}: Props) {
  const [title, setTitle] = useState(values.title);
  // Only disable "Sichern" once JS runs, so the form can still be sent without it
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const isInvalid = (field: RecipeFormField) => invalidFields.includes(field);
  const errorProps = (field: keyof typeof TEXT.errors) =>
    isInvalid(field) ? { 'aria-invalid': true, 'aria-describedby': `${field}-error` } : {};
  const error = (field: keyof typeof TEXT.errors) =>
    isInvalid(field) && (
      <span id={`${field}-error`} class={styles.error}>
        {TEXT.errors[field]}
      </span>
    );

  return (
    <form method="post" class={styles.form}>
      <header class={styles.header}>
        <a class={styles.headerButton} href={cancelHref} data-back>
          {TEXT.cancel}
        </a>
        <h1 class={styles.heading}>{isNew ? TEXT.newTitle : TEXT.editTitle}</h1>
        <button
          type="submit"
          class={`${styles.headerButton} ${styles.save}`}
          disabled={hydrated && title.trim() === ''}
        >
          {TEXT.save}
        </button>
      </header>

      <div class={styles.body}>
        {(saveFailed || invalidFields.length > 0) && (
          <p class={styles.alert} role="alert">
            {saveFailed ? TEXT.saveFailed : TEXT.invalid}
          </p>
        )}

        <Field label={TEXT.title}>
          <input
            class={`${styles.input} ${styles.titleInput}`}
            name="title"
            value={title}
            onInput={(event) => setTitle(event.currentTarget.value)}
            placeholder={TEXT.titlePlaceholder}
            required
            {...errorProps('title')}
          />
          {error('title')}
        </Field>

        <ChipGroup label={TEXT.category}>
          {CATEGORIES.map(({ value }) => (
            <Chip type="radio" name="category" value={value} label={value} values={values} />
          ))}
          {error('category')}
        </ChipGroup>

        <ChipGroup label={TEXT.meals}>
          {MEALS.map(({ value, name }) => (
            <Chip
              type="checkbox"
              name="meals"
              value={value}
              label={TEXT.mealLabels[name]}
              values={values}
            />
          ))}
          {error('meals')}
        </ChipGroup>

        <div class={styles.numbers}>
          <Field label={TEXT.servings}>
            <input
              class={styles.input}
              name="servings"
              defaultValue={values.servings}
              inputMode="numeric"
              placeholder="4"
              {...errorProps('servings')}
            />
          </Field>
          <Field label={TEXT.workTime}>
            <input
              class={styles.input}
              name="workTime"
              defaultValue={values.workTime}
              placeholder="0:30"
              {...errorProps('workTime')}
            />
          </Field>
          <Field label={TEXT.totalTime}>
            <input
              class={styles.input}
              name="totalTime"
              defaultValue={values.totalTime}
              placeholder="1:00"
              {...errorProps('totalTime')}
            />
          </Field>
        </div>
        {/* Below the row of three, so a message doesn't squeeze one narrow column */}
        {error('servings')}
        {error('workTime')}
        {error('totalTime')}

        <Field label={TEXT.ingredients}>
          <textarea
            class={`${styles.input} ${styles.textarea}`}
            name="ingredients"
            rows={9}
            placeholder={TEXT.ingredientsPlaceholder}
            aria-describedby="ingredients-help"
            defaultValue={values.ingredients}
          />
          <span id="ingredients-help" class={styles.help}>
            {TEXT.ingredientsHelp}
          </span>
        </Field>

        <Field label={TEXT.steps}>
          <textarea
            class={`${styles.input} ${styles.textarea}`}
            name="steps"
            rows={10}
            placeholder={TEXT.stepsPlaceholder}
            aria-describedby="steps-help"
            defaultValue={values.steps}
          />
          <span id="steps-help" class={styles.help}>
            {TEXT.stepsHelp}
          </span>
        </Field>

        <div class={styles.sourceRow}>
          <Field label={TEXT.source}>
            {/* A list instead of the design's text field: Quelle only takes known values (03-data-model) */}
            <select class={styles.input} name="source" {...errorProps('source')}>
              <option value="" selected={values.source === ''}>
                {TEXT.noSource}
              </option>
              {SOURCES.map((source) => (
                <option value={source} selected={values.source === source}>
                  {source}
                </option>
              ))}
            </select>
          </Field>
          <Field label={TEXT.sourceUrl}>
            <input
              class={styles.input}
              name="sourceUrl"
              type="url"
              defaultValue={values.sourceUrl}
              placeholder="https://"
              {...errorProps('sourceUrl')}
            />
          </Field>
        </div>
        {error('source')}
        {error('sourceUrl')}

        <Field label={TEXT.notes}>
          <textarea
            class={`${styles.input} ${styles.textarea}`}
            name="notes"
            rows={5}
            placeholder={TEXT.notesPlaceholder}
            defaultValue={values.notes}
          />
        </Field>

        <p class={styles.hint}>{TEXT.hint}</p>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <label class={styles.field}>
      <span class={styles.label}>{label}</span>
      {children}
    </label>
  );
}

function ChipGroup({ label, children }: { label: string; children: ComponentChildren }) {
  return (
    <fieldset class={styles.chipGroup}>
      <legend class={styles.label}>{label}</legend>
      <div class={styles.chips}>{children}</div>
    </fieldset>
  );
}

type ChipProps = {
  type: 'radio' | 'checkbox';
  name: 'category' | 'meals';
  value: string;
  label: string;
  values: RecipeFormValues;
};

// Like Chip.astro's checkbox: the input covers the chip, so the whole chip is tappable
function Chip({ type, name, value, label, values }: ChipProps) {
  const checked = name === 'category' ? values.category === value : values.meals.includes(value);
  return (
    <label class={styles.chip}>
      <input
        class={styles.chipInput}
        type={type}
        name={name}
        value={value}
        defaultChecked={checked}
      />
      {label}
    </label>
  );
}
