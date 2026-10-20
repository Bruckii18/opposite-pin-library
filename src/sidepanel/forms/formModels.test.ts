import { describe, expect, it } from 'vitest';
import { CAST_FILTER, DEATH_BADGE, MOONFIRE_DECORATOR } from '../../test/pinFixtures';
import { readViewParams } from '../../wcl/reportUrl';
import {
  EMPTY_ENTRY_FORM_VALUES,
  entryFormValuesForActivePins,
  interpretPinsInput,
  suggestEntryName,
  validateEntryForm,
} from './entryFormModel';
import {
  describeViewParams,
  EMPTY_VIEW_FORM_VALUES,
  layoutFromOption,
  NO_PARAM_OPTION_VALUE,
  summarizeViewParams,
  TAB_OPTIONS,
  tabFromOption,
  validateViewForm,
  viewFormValuesForCapture,
} from './viewFormModel';

describe('validateEntryForm', () => {
  it('builds a one-pin draft with trimmed text, parsed tags and a suggested name', () => {
    const validation = validateEntryForm({
      ...EMPTY_ENTRY_FORM_VALUES,
      pinsInput: ` ${DEATH_BADGE} `,
      name: '  ',
      description: ' Who died first ',
      tags: 'raid, Raid, mythic',
    });

    expect(validation).toEqual({
      valid: true,
      output: {
        pins: [DEATH_BADGE],
        name: 'Badge: type = "death"',
        description: 'Who died first',
        tags: ['raid', 'mythic'],
        viewParams: undefined,
      },
    });
  });

  it('reads one pin per line and pins joined with ^, and stores each pin once', () => {
    const pinsInput = `${DEATH_BADGE}\n\n${CAST_FILTER}^${MOONFIRE_DECORATOR}\n${DEATH_BADGE}`;

    expect(interpretPinsInput(pinsInput)).toEqual({
      valid: true,
      pins: [DEATH_BADGE, CAST_FILTER, MOONFIRE_DECORATOR],
    });
  });

  it('saves bare filter expressions as Filter pins', () => {
    const validation = validateEntryForm({ ...EMPTY_ENTRY_FORM_VALUES, pinsInput: 'type = "cast"' });

    expect(validation.valid && validation.output).toMatchObject({
      pins: ['2$Off$#244F4B$expression$type = "cast"'],
      name: 'Filter: type = "cast"',
    });
  });

  it('names the line of an invalid pin', () => {
    const validation = validateEntryForm({ ...EMPTY_ENTRY_FORM_VALUES, pinsInput: `${DEATH_BADGE}\n1$Off$broken` });

    expect(validation).toEqual({
      valid: false,
      errors: {
        pinsInput:
          'Line 2: This does not look like a Warcraft Logs pin string. Filter expressions cannot contain "$" or "^".',
      },
    });
  });

  it('requires at least one pin', () => {
    expect(validateEntryForm(EMPTY_ENTRY_FORM_VALUES)).toEqual({
      valid: false,
      errors: { pinsInput: 'Paste at least one pin string or filter expression.' },
    });
  });

  it('requires a name for several pins, because no name can be suggested', () => {
    const pinsInput = `${DEATH_BADGE}\n${CAST_FILTER}`;

    expect(suggestEntryName(pinsInput)).toBe('');
    expect(validateEntryForm({ ...EMPTY_ENTRY_FORM_VALUES, pinsInput })).toEqual({
      valid: false,
      errors: { name: 'Give these pins a name.' },
    });
    expect(validateEntryForm({ ...EMPTY_ENTRY_FORM_VALUES, pinsInput, name: 'Coiled Altar' })).toMatchObject({
      valid: true,
      output: { name: 'Coiled Altar', pins: [DEATH_BADGE, CAST_FILTER] },
    });
  });
});

describe('view fields', () => {
  it('saves no view unless the checkbox is ticked', () => {
    const values = entryFormValuesForActivePins([DEATH_BADGE], { tab: 'damage-taken', view: 'events' });

    const validation = validateEntryForm(values);

    expect(values.view.isEnabled).toBe(false);
    expect(validation.valid && validation.output.viewParams).toBeUndefined();
  });

  it('captures the current view of the report when the checkbox is ticked', () => {
    const values = entryFormValuesForActivePins([DEATH_BADGE], { tab: 'damage-taken', ability: '1304424' });

    const validation = validateEntryForm({ ...values, view: { ...values.view, isEnabled: true } });

    expect(validation.valid && validation.output.viewParams).toEqual({ tab: 'damage-taken', ability: '1304424' });
  });

  it('stores tab = debuffs for a pin captured on the Debuffs tab', () => {
    const debuffsTabUrl = new URL(
      'https://www.warcraftlogs.com/reports/AbC123?fight=3&type=auras&spells=debuffs&ability=1282419',
    );
    const values = entryFormValuesForActivePins([DEATH_BADGE], readViewParams(debuffsTabUrl));

    const validation = validateEntryForm({ ...values, view: { ...values.view, isEnabled: true } });

    expect(validation.valid && validation.output.viewParams).toEqual({ tab: 'debuffs', ability: '1282419' });
  });

  it('trims the ability and leaves out empty fields, Friendlies and Tables', () => {
    expect(validateViewForm({ ...EMPTY_VIEW_FORM_VALUES, isEnabled: true, tab: 'buffs', ability: '  ' })).toEqual({
      valid: true,
      viewParams: { tab: 'buffs' },
    });
    expect(validateViewForm({ ...EMPTY_VIEW_FORM_VALUES, isEnabled: true })).toEqual({ valid: true, viewParams: {} });
  });

  it('saves Enemies, the ability and the layout', () => {
    const validation = validateViewForm({
      isEnabled: true,
      tab: 'debuffs',
      hostility: '1',
      ability: ' 1282419 ',
      layout: 'timeline',
    });

    expect(validation).toEqual({
      valid: true,
      viewParams: { tab: 'debuffs', hostility: '1', ability: '1282419', view: 'timeline' },
    });
  });

  it('saves a captured hostility=0 as the default Friendlies', () => {
    const values = viewFormValuesForCapture({ tab: 'healing', hostility: '0' });

    expect(validateViewForm({ ...values, isEnabled: true })).toEqual({ valid: true, viewParams: { tab: 'healing' } });
  });

  it('requires a numeric spell ID for the ability', () => {
    const validation = validateEntryForm({
      ...EMPTY_ENTRY_FORM_VALUES,
      pinsInput: DEATH_BADGE,
      view: { ...EMPTY_VIEW_FORM_VALUES, isEnabled: true, ability: 'Fireball' },
    });

    expect(validation).toEqual({ valid: false, errors: { view: 'Ability (spell ID) must be a number.' } });
  });

  it('offers the tabs with their WCL labels and accepts only known dropdown values', () => {
    expect(TAB_OPTIONS.map((option) => option.label)).toEqual(
      expect.arrayContaining(['Default', 'Damage Taken', 'Buffs', 'Debuffs']),
    );
    expect(tabFromOption('debuffs')).toBe('debuffs');
    expect(tabFromOption('auras')).toBeUndefined();
    expect(tabFromOption(NO_PARAM_OPTION_VALUE)).toBeUndefined();
    expect(layoutFromOption('events')).toBe('events');
    expect(layoutFromOption(NO_PARAM_OPTION_VALUE)).toBeUndefined();
  });

  it('saves the current view with all active pins saved together', () => {
    const values = entryFormValuesForActivePins([DEATH_BADGE, CAST_FILTER], { tab: 'debuffs', ability: '1304424' });

    const validation = validateEntryForm({ ...values, name: 'Prog', view: { ...values.view, isEnabled: true } });

    expect(validation.valid && validation.output).toMatchObject({
      pins: [DEATH_BADGE, CAST_FILTER],
      viewParams: { tab: 'debuffs', ability: '1304424' },
    });
  });

  it('labels a saved view with the tab label instead of the raw type', () => {
    expect(summarizeViewParams({ tab: 'debuffs', ability: '1282419' })).toBe('Debuffs · 1282419');
    expect(summarizeViewParams({ tab: 'damage-taken', hostility: '1', ability: '1304424', view: 'events' })).toBe(
      'Damage Taken · Enemies · 1304424 · Events',
    );
    expect(summarizeViewParams({})).toBe('default');
    expect(describeViewParams({ tab: 'buffs', view: 'timeline' })).toBe('Tab: Buffs, Layout: Timeline');
  });
});
