// Login screen (design/README.md, "0. Login"). A plain <form method="post">, so it works
// without JS and the iPhone's password manager recognizes the field. JS only adds the
// show/hide toggle and puts the screen back to normal when typing after a wrong password.
import { useState } from 'preact/hooks';
import Maulti from './Maulti.tsx';
import styles from './LoginForm.module.css';
import { TEXT } from './LoginForm.texts.ts';

type Props = {
  /** The last attempt had a wrong password */
  error?: boolean;
};

export default function LoginForm({ error = false }: Props) {
  const [showError, setShowError] = useState(error);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form method="post" class={styles.form}>
      <Maulti pose={showError ? 'think' : 'lock'} size={170} />
      <h1 class={styles.title}>{TEXT.title}</h1>
      <p class={styles.text} aria-live="polite">
        {showError ? TEXT.wrongPassword : TEXT.intro}
      </p>
      <div class={showError ? `${styles.field} ${styles.fieldError}` : styles.field}>
        <input
          class={styles.input}
          type={showPassword ? 'text' : 'password'}
          name="password"
          autocomplete="current-password"
          placeholder={TEXT.password}
          aria-label={TEXT.password}
          aria-invalid={showError}
          required
          onInput={() => setShowError(false)}
        />
        <button type="button" class={styles.toggle} onClick={() => setShowPassword(!showPassword)}>
          {showPassword ? TEXT.hide : TEXT.show}
        </button>
      </div>
      <button type="submit" class={styles.submit}>
        {TEXT.submit}
      </button>
      <p class={styles.hint}>{TEXT.hint}</p>
    </form>
  );
}
