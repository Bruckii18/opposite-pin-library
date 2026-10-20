import { useId, useRef } from 'react';
import { completeTag, suggestTags, tagKey } from '../../library/tags';
import { useExistingTags } from '../hooks/useExistingTags';
import { FormField } from './FormField';

type TagsFieldProps = {
  readonly value: string;
  readonly hint: string;
  readonly onChange: (value: string) => void;
};

export function TagsField({ value, hint, onChange }: TagsFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const existingTags = useExistingTags();
  const suggestions = suggestTags(existingTags, value);

  const addSuggestedTag = (tag: string): void => {
    onChange(completeTag(value, tag));
    inputRef.current?.focus();
  };

  return (
    <FormField label="Tags" htmlFor={inputId} hint={hint}>
      <input
        ref={inputRef}
        id={inputId}
        className="input"
        value={value}
        autoComplete="off"
        onChange={(event) => onChange(event.target.value)}
      />
      {suggestions.length > 0 && (
        <div className="tag-suggestions" role="group" aria-label="Existing tags">
          {suggestions.map((tag) => (
            <button
              key={tagKey(tag)}
              type="button"
              className="tag tag--toggle tag--suggestion"
              aria-label={`Add tag ${tag}`}
              onClick={() => addSuggestedTag(tag)}
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </FormField>
  );
}
