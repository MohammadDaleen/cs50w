interface ListBoxSingleItemSpec {
  text: string;
  value: string;
}
interface ListBoxNestedItemSpec {
  text: string;
  items: ListBoxItemSpec[];
}
export type ListBoxItemSpec = ListBoxNestedItemSpec | ListBoxSingleItemSpec;
interface FormComponentSpec {
  type: string;
  name: string;
}
interface FormComponentWithLabelSpec extends FormComponentSpec {
  label?: string;
}
export interface ListBoxSpec extends FormComponentWithLabelSpec {
  type: "listbox";
  items: ListBoxItemSpec[];
  disabled?: boolean;
  context?: string;
}
export interface PanelSpec {
  type: "panel";
  classes?: string[];
  items: BodyComponentSpec[];
}
interface BarSpec {
  type: "bar";
  items: BodyComponentSpec[];
}
interface ButtonSpec {
  type: "button";
  text: string;
  enabled?: boolean;
  primary?: boolean;
  name?: string;
  icon?: string;
  borderless?: boolean;
  buttonType?: "primary" | "secondary" | "toolbar";
  context?: string;
}
interface CommonMenuItemSpec {
  enabled?: boolean;
  text?: string;
  value?: string;
  meta?: Record<string, any>;
  shortcut?: string;
  context?: string;
}
interface DialogToggleMenuItemSpec extends CommonMenuItemSpec {
  type?: "togglemenuitem";
  name: string;
}
type DialogFooterMenuButtonItemSpec = DialogToggleMenuItemSpec;
interface BaseDialogFooterButtonSpec {
  name?: string;
  align?: "start" | "end";
  primary?: boolean;
  enabled?: boolean;
  icon?: string;
  buttonType?: "primary" | "secondary";
  context?: string;
}
interface DialogFooterNormalButtonSpec extends BaseDialogFooterButtonSpec {
  type: "submit" | "cancel" | "custom";
  text: string;
}
interface DialogFooterMenuButtonSpec extends BaseDialogFooterButtonSpec {
  type: "menu";
  text?: string;
  tooltip?: string;
  icon?: string;
  items: DialogFooterMenuButtonItemSpec[];
}
interface DialogFooterToggleButtonSpec extends BaseDialogFooterButtonSpec {
  type: "togglebutton";
  tooltip?: string;
  icon?: string;
  text?: string;
  active?: boolean;
}
type DialogFooterButtonSpec =
  | DialogFooterNormalButtonSpec
  | DialogFooterMenuButtonSpec
  | DialogFooterToggleButtonSpec;
interface TabSpec {
  name?: string;
  title: string;
  items: BodyComponentSpec[];
}
interface TabPanelSpec {
  type: "tabpanel";
  tabs: TabSpec[];
}
type DialogDataItem = any;
type DialogData = Record<string, DialogDataItem>;

interface DialogActionDetails {
  name: string;
  value?: any;
}
interface DialogChangeDetails<T> {
  name: keyof T;
}
interface DialogTabChangeDetails {
  newTabName: string;
  oldTabName: string;
}

type DialogActionHandler<T extends DialogData> = (
  api: DialogInstanceApi<T>,
  details: DialogActionDetails
) => void;
export type DialogChangeHandler<T extends DialogData> = (
  api: DialogInstanceApi<T>,
  details: DialogChangeDetails<T>
) => void;
type DialogSubmitHandler<T extends DialogData> = (
  api: DialogInstanceApi<T>
) => void;
type DialogCloseHandler = () => void;
type DialogCancelHandler<T extends DialogData> = (
  api: DialogInstanceApi<T>
) => void;
type DialogTabChangeHandler<T extends DialogData> = (
  api: DialogInstanceApi<T>,
  details: DialogTabChangeDetails
) => void;
type DialogSize = "normal" | "medium" | "large";
export type FilePickerCallback = (
  callback: (value: string, meta?: Record<string, any>) => void,
  value: string,
  meta: Record<string, any>
) => void;
export interface DialogSpec<T extends DialogData> {
  title: string;
  size?: DialogSize;
  body: TabPanelSpec | PanelSpec;
  buttons?: DialogFooterButtonSpec[];
  initialData?: Partial<T>;
  onAction?: DialogActionHandler<T>;
  onChange?: DialogChangeHandler<T>;
  onSubmit?: DialogSubmitHandler<T>;
  onClose?: DialogCloseHandler;
  onCancel?: DialogCancelHandler<T>;
  onTabChange?: DialogTabChangeHandler<T>;
}

export interface DialogInstanceApi<T extends DialogData> {
  getData: () => T;
  setData: (data: Partial<T>) => void;
  setEnabled: (name: string, state: boolean) => void;
  focus: (name: string) => void;
  showTab: (name: string) => void;
  redial: (nu: DialogSpec<T>) => void;
  block: (msg: string) => void;
  unblock: () => void;
  toggleFullscreen: () => void;
  close: () => void;
}
interface TextAreaSpec extends FormComponentWithLabelSpec {
  type: "textarea";
  placeholder?: string;
  maximized?: boolean;
  enabled?: boolean;
  context?: string;
}
interface CheckboxSpec extends FormComponentSpec {
  type: "checkbox";
  label: string;
  enabled?: boolean;
  context?: string;
}
interface ImagePreviewSpec extends FormComponentSpec {
  type: "imagepreview";
  height?: string;
}
interface InputSpec extends FormComponentWithLabelSpec {
  type: "input";
  inputMode?: string;
  placeholder?: string;
  maximized?: boolean;
  enabled?: boolean;
  context?: string;
}
interface HtmlPanelSpec {
  type: "htmlpanel";
  html: string;
  onInit?: (el: HTMLElement) => void;
  presets?: "presentation" | "document";
  stretched?: boolean;
}
interface IframeSpec extends FormComponentWithLabelSpec {
  type: "iframe";
  border?: boolean;
  sandboxed?: boolean;
  streamContent?: boolean;
  transparent?: boolean;
}
interface CustomEditorInit {
  setValue: (value: string) => void;
  getValue: () => string;
  destroy: () => void;
}
interface CustomEditorOldSpec extends FormComponentSpec {
  type: "customeditor";
  tag?: string;
  init: (e: HTMLElement) => Promise<CustomEditorInit>;
}
interface CustomEditorNewSpec extends FormComponentSpec {
  type: "customeditor";
  tag?: string;
  scriptId: string;
  scriptUrl: string;
  onFocus?: (e: HTMLElement) => void;
  settings?: any;
}
type CustomEditorSpec = CustomEditorOldSpec | CustomEditorNewSpec;
interface DropZoneSpec extends FormComponentWithLabelSpec {
  type: "dropzone";
  context?: string;
}
interface GridSpec {
  type: "grid";
  columns: number;
  items: BodyComponentSpec[];
}
interface SelectBoxItemSpec {
  text: string;
  value: string;
}
interface SelectBoxSpec extends FormComponentWithLabelSpec {
  type: "selectbox";
  items: SelectBoxItemSpec[];
  size?: number;
  enabled?: boolean;
  context?: string;
}
interface SizeInputSpec extends FormComponentWithLabelSpec {
  type: "sizeinput";
  constrain?: boolean;
  enabled?: boolean;
  context?: string;
}
interface SliderSpec extends FormComponentSpec {
  type: "slider";
  label: string;
  min?: number;
  max?: number;
}
interface UrlInputSpec extends FormComponentWithLabelSpec {
  type: "urlinput";
  filetype?: "image" | "media" | "file";
  enabled?: boolean;
  picker_text?: string;
  context?: string;
}
interface ColorInputSpec extends FormComponentWithLabelSpec {
  type: "colorinput";
  storageKey?: string;
  context?: string;
}
interface ColorPickerSpec extends FormComponentWithLabelSpec {
  type: "colorpicker";
}
interface AlertBannerSpec {
  type: "alertbanner";
  level: "info" | "warn" | "error" | "success";
  text: string;
  icon: string;
  url?: string;
}
interface CollectionSpec extends FormComponentWithLabelSpec {
  type: "collection";
  context?: string;
}
type Alignment = "start" | "center" | "end";
interface LabelSpec {
  type: "label";
  label: string;
  items: BodyComponentSpec[];
  align?: Alignment;
  for?: string;
}
interface TableSpec {
  type: "table";
  header: string[];
  cells: string[][];
}
type BodyComponentSpec =
  | BarSpec
  | ButtonSpec
  | CheckboxSpec
  | TextAreaSpec
  | InputSpec
  | ListBoxSpec
  | SelectBoxSpec
  | SizeInputSpec
  | SliderSpec
  | IframeSpec
  | HtmlPanelSpec
  | UrlInputSpec
  | DropZoneSpec
  | ColorInputSpec
  | GridSpec
  | ColorPickerSpec
  | ImagePreviewSpec
  | AlertBannerSpec
  | CollectionSpec
  | LabelSpec
  | TableSpec
  // | TreeSpec
  | PanelSpec
  | CustomEditorSpec;
