import { describe, expect, it } from 'vitest';
import { savedPinIdSchema } from '../../library/librarySchema';
import { DEATH_BADGE } from '../../test/pinFixtures';
import { EMPTY_PIN_FORM_VALUES, validatePinForm } from './pinFormModel';
import { EMPTY_SET_FORM_VALUES, togglePinSelection, validateSetForm } from './setFormModel';

const FIRST_PIN_ID = savedPinIdSchema.parse('pin-1');
const SECOND_PIN_ID = savedPinIdSchema.parse('pin-2');

describe('validatePinForm', () => {
  it('builds a draft with trimmed text, parsed tags and a suggested name', () => {
    const validation = validatePinForm({
      pinInput: ` ${DEATH_BADGE} `,
      name: '  ',
      description: ' Who died first ',
      tags: 'raid, Raid, mythic',
    });

    expect(validation).toEqual({
      valid: true,
      output: {
        pinString: DEATH_BADGE,
        name: 'Badge: type = "death"',
        description: 'Who died first',
        tags: ['raid', 'mythic'],
      },
    });
  });

  it('explains why the pin string is invalid', () => {
    const validation = validatePinForm({ ...EMPTY_PIN_FORM_VALUES, pinInput: '1$Off$broken' });

    expect(validation).toEqual({
      valid: false,
      errors: {
        pinInput:
          'This does not look like a Warcraft Logs pin string. Filter expressions cannot contain "$" or "^".',
      },
    });
  });

  it('saves a bare filter expression as a Filter pin named after the expression', () => {
    const validation = validatePinForm({ ...EMPTY_PIN_FORM_VALUES, pinInput: 'type = "cast"' });

    expect(validation.valid && validation.output).toMatchObject({
      pinString: '2$Off$#244F4B$expression$type = "cast"',
      name: 'Filter: type = "cast"',
    });
  });
});

describe('validateSetForm', () => {
  it('requires a name and at least one pin', () => {
    expect(validateSetForm(EMPTY_SET_FORM_VALUES)).toEqual({
      valid: false,
      errors: { name: 'Give the set a name.', pinIds: 'Pick at least one pin.' },
    });
  });

  it('keeps the pin order in which pins were picked', () => {
    const pinIds = togglePinSelection(togglePinSelection([], SECOND_PIN_ID), FIRST_PIN_ID);

    const validation = validateSetForm({ ...EMPTY_SET_FORM_VALUES, name: 'Raid', pinIds });

    expect(validation.valid && validation.output.pinIds).toEqual([SECOND_PIN_ID, FIRST_PIN_ID]);
    expect(togglePinSelection(pinIds, SECOND_PIN_ID)).toEqual([FIRST_PIN_ID]);
  });
});
