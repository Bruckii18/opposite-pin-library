import { describe, expect, it } from 'vitest';
import { savedPinIdSchema } from '../../library/librarySchema';
import { DEATH_BADGE } from '../../test/pinFixtures';
import { EMPTY_PIN_FORM_VALUES, pinFormValuesForActivePin, validatePinForm } from './pinFormModel';
import {
  EMPTY_SET_FORM_VALUES,
  setDetailsValuesForActiveReport,
  togglePinSelection,
  validateSetDetails,
  validateSetForm,
} from './setFormModel';
import { summarizeViewParams, validateViewForm } from './viewFormModel';

const FIRST_PIN_ID = savedPinIdSchema.parse('pin-1');
const SECOND_PIN_ID = savedPinIdSchema.parse('pin-2');

describe('validatePinForm', () => {
  it('builds a draft with trimmed text, parsed tags and a suggested name', () => {
    const validation = validatePinForm({
      ...EMPTY_PIN_FORM_VALUES,
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
        viewParams: undefined,
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

describe('view fields', () => {
  it('saves no view unless the checkbox is ticked', () => {
    const values = pinFormValuesForActivePin(DEATH_BADGE, { type: 'damage-taken', view: 'events' });

    const validation = validatePinForm(values);

    expect(values.view.isEnabled).toBe(false);
    expect(validation.valid && validation.output.viewParams).toBeUndefined();
  });

  it('captures the current view of the report when the checkbox is ticked', () => {
    const values = pinFormValuesForActivePin(DEATH_BADGE, { type: 'damage-taken', ability: '1304424' });

    const validation = validatePinForm({ ...values, view: { ...values.view, isEnabled: true } });

    expect(validation.valid && validation.output.viewParams).toEqual({ type: 'damage-taken', ability: '1304424' });
  });

  it('trims the fields and drops empty ones, so an empty layout means Tables', () => {
    expect(
      validateViewForm({ isEnabled: true, params: { type: ' auras ', ability: '  ', view: '' } }),
    ).toEqual({ valid: true, viewParams: { type: 'auras' } });
    expect(validateViewForm({ isEnabled: true, params: {} })).toEqual({ valid: true, viewParams: {} });
  });

  it('requires a numeric spell ID for the ability', () => {
    const validation = validatePinForm({
      ...EMPTY_PIN_FORM_VALUES,
      pinInput: DEATH_BADGE,
      view: { isEnabled: true, params: { ability: 'Fireball' } },
    });

    expect(validation).toEqual({ valid: false, errors: { view: 'Ability (spell ID) must be a number.' } });
  });

  it('saves the current view with a set saved from the active pins', () => {
    const values = setDetailsValuesForActiveReport({ type: 'debuffs', ability: '1304424' });

    const validation = validateSetDetails({ ...values, name: 'Prog', view: { ...values.view, isEnabled: true } });

    expect(validation.valid && validation.output.viewParams).toEqual({ type: 'debuffs', ability: '1304424' });
  });

  it('summarizes a saved view for the list label', () => {
    expect(summarizeViewParams({ type: 'damage-taken', ability: '1304424', view: 'events' })).toBe(
      'damage-taken · 1304424 · events',
    );
    expect(summarizeViewParams({})).toBe('default');
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
