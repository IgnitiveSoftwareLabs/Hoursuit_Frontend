// components/InfiniteScrollAutocomplete.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Autocomplete, TextField as AutocompleteTextField, CircularProgress, FormControl, FormLabel } from '@mui/material';
import { debounce } from 'lodash';
import { useAppDispatch } from '../Hooks/Reduxhook/hooks';
import { toast } from 'react-hot-toast';

interface InfiniteScrollAutocompleteProps {
  id: string;
  label?: string;
  placeholder: string;
  options: any[];
  getOptionLabel: (option: any) => string;
  fetchData: (page: number, limit: number, search: string, append: boolean) => Promise<void>;
  formikField: string;
  formik: any;
  disabled?: boolean;
  dependentFieldReset?: { field: string; value: any }[];
  setOptions: (options: any[]) => void;
  setPagination: (pagination: any) => void;
  pagination: any;
}

const InfiniteScrollAutocomplete: React.FC<InfiniteScrollAutocompleteProps> = ({
  id,
  label,
  placeholder,
  options,
  getOptionLabel,
  fetchData,
  formikField,
  formik,
  disabled = false,
  dependentFieldReset = [],
  setOptions,
  setPagination,
  pagination,
}) => {
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [inputValue, setInputValue] = useState<string>('');

  // Debounced fetch function to prevent too many API calls
  const debouncedFetch = useCallback(
    debounce((searchQuery: string) => {
      setPage(1);
      setHasMore(true);
      fetchData(1, 10, searchQuery, false);
    }, 500),
    [fetchData]
  );

  // Handle input changes from user typing
  const handleSearch = (_event: React.ChangeEvent<{}>, value: string, reason: string) => {
    setInputValue(value);
    setSearch(value);
    debouncedFetch(value);

    if (reason === 'clear' || value === '') {
      formik.setFieldValue(formikField, null);
      dependentFieldReset.forEach(({ field, value }) => {
        formik.setFieldValue(field, value);
      });
    }
  };

  // Handle scroll for infinite scroll loading
  const handleScroll = (event: React.UIEvent<HTMLElement>) => {
    if (!hasMore || loading) return;
    const target = event.target as HTMLElement;
    const isBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 10;
    if (isBottom) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchData(nextPage, 10, search, true);
    }
  };

  // Initial fetch on mount if options empty and not disabled
  useEffect(() => {
    if (options.length === 0 && !disabled && !formik.values[formikField]) {
      fetchData(1, 10, '', false);
    }
  }, [fetchData, options.length, disabled, formik.values[formikField]]);

  // Find the selected option by formik value
  const selectedOption = useMemo(
    () => options.find((option) => option.id === formik.values[formikField]) || null,
    [options, formik.values[formikField]]
  );

  // Update input value when selected option changes
  useEffect(() => {
    if (selectedOption) {
      setInputValue(getOptionLabel(selectedOption));
    } else if (formik.values[formikField] === null || formik.values[formikField] === 0) {
      setInputValue('');
    }
  }, [selectedOption, formik.values[formikField], getOptionLabel]);

  return (
    <FormControl error={formik.touched[formikField] && !!formik.errors[formikField]} sx={{ width: '100%' }}>
      <FormLabel htmlFor={id}>{label}</FormLabel>
      <Autocomplete
      fullWidth
        id={id}
        options={options}
        getOptionLabel={getOptionLabel}
        value={selectedOption}
        inputValue={inputValue}
        onChange={(_event, value) => {
          formik.setFieldValue(formikField, value ? value.id : null);
          setInputValue(value ? getOptionLabel(value) : '');
          dependentFieldReset.forEach(({ field, value }) => {
            formik.setFieldValue(field, value);
          });
        }}
        onInputChange={handleSearch}
        filterOptions={(x) => x} // Disable client-side filtering — show backend results as-is
        popupIcon={null}
        disabled={disabled}
        onOpen={() => {
          if (options.length === 0 && !disabled) {
            fetchData(1, 10, '', false);
          }
        }}
        ListboxProps={{
          onScroll: handleScroll,
          style: { maxHeight: '200px', overflow: 'auto' },
        }}
        renderInput={(params) => (
          <AutocompleteTextField
            {...params}
            placeholder={placeholder}
            variant="outlined"
            error={formik.touched[formikField] && !!formik.errors[formikField]}
            helperText={formik.touched[formikField] && formik.errors[formikField]}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {getOptionLabel(option)}
          </li>
        )}
        loading={loading}
        clearOnBlur={false}

      />
    </FormControl>
  );
};

export default InfiniteScrollAutocomplete;
