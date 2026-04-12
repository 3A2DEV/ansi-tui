import { useState, useCallback } from 'react';

export interface PathPickerState {
  pickerOpen: boolean;
  pickerField: string | null;
  pickerCurrentValue: string;
  openPicker: (fieldKey: string, currentValue: string) => void;
  closePicker: () => void;
}

export function usePathPicker(): PathPickerState {
  const [pickerField, setPickerField] = useState<string | null>(null);
  const [pickerCurrentValue, setPickerCurrentValue] = useState('');

  const openPicker = useCallback((fieldKey: string, currentValue: string) => {
    setPickerField(fieldKey);
    setPickerCurrentValue(currentValue);
  }, []);

  const closePicker = useCallback(() => {
    setPickerField(null);
    setPickerCurrentValue('');
  }, []);

  return {
    pickerOpen: pickerField !== null,
    pickerField,
    pickerCurrentValue,
    openPicker,
    closePicker,
  };
}
