import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
// import { ChatTextarea } from "./chat-textarea";
// import { ClearButton } from "./clear-button";
// import { CountrySelect } from "./country-select";
// import { CalendarRange, DateSelect } from "./date-select";
// import { HashtagTagsField } from "./hashtag-tags-field";
// import { KeywordTagsField } from "./keyword-tags-field";
// import { MoneyInput } from "./money-input";
// import { MultiSelect, MultiSelectInline } from "./multi-select";
// import { RangeInput } from "./range-input";
// import {
//   SingleSelect,
//   SingleSelectInline,
//   SingleSelectMenu,
// } from "./single-select";
import { SubmitButton } from "./submit-button";
// import { SwitchField } from "./switch-field";
// import { Textarea } from "./text-area";
import { TextField } from "./text-field";

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // ChatTextarea,
    TextField,
    // HashtagTags: HashtagTagsField,
    // KeywordTags: KeywordTagsField,
    // Textarea,
    // MoneyInput,
    // MultiSelect,
    // MultiSelectInline,
    // SingleSelect,
    // SingleSelectInline,
    // SingleSelectMenu,
    // Switch: SwitchField,
    // RangeInput,
    // CalendarRange,
    // DateSelect,
    // CountrySelect,
  },
  formComponents: {
    SubmitButton,
    // ClearButton,
  },
});
