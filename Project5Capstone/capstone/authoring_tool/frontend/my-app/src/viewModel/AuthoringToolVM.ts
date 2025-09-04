import { makeAutoObservable } from "mobx";
import type { Bookmark, Editor as TinyMCEEditor } from "tinymce/tinymce";
import CdsService from "../cdsService/CdsService";
// import { IInputs } from "../generated/ManifestTypes";
import ServiceProvider from "../ServiceProvider";
import type {
  SelectedContent,
  DrawerSize,
  DrawerType,
  Guid,
  Attachment,
  Resource,
  Content,
  CdsResponse,
  User,
} from "../types/index";
import { filetype } from "../enums/filetype";
import { load } from "cheerio";
import { resourcetype } from "../enums";
// import { axa_status } from "../cds-generated/enums/axa_status";
import { MathfieldElement } from "mathlive";

export default class AuthoringToolVM {
  // Static service name for registration purposes
  public static readonly serviceName = "AuthoringToolVM";

  // Dependencies and context
  public serviceProvider: ServiceProvider;
  public cdsService: CdsService;

  // State and error handling
  private errorCounter: number = 0;
  private errorMessages: Map<number, string> = new Map();
  public get ErrorMessages() {
    return this.errorMessages;
  }
  private set ErrorMessages(errMsgs: Map<number, string>) {
    this.errorMessages = errMsgs;
  }

  private pcfError?: string = undefined;
  get PcfError() {
    return this.pcfError;
  }
  private set PcfError(value: string | undefined) {
    this.pcfError = value;
  }

  // Function to force a UI update (should be set by the consumer)
  // *TODO: public forceUpdate: () => void;
  public forceUpdate: () => void = () => {};

  /* ----- Loading indicator ----- */
  // General Loading indicator
  private isLoading: boolean = false;
  // Syncing content sequence indicator
  private isSyncingContentSequence: boolean = false;
  public get IsLoading() {
    return this.isLoading || this.isSyncingContentSequence;
  }
  public set IsLoading(isLoading: boolean) {
    this.isLoading = isLoading;
  }
  public set IsSyncingContentSequence(IsSyncingContentSequence: boolean) {
    this.IsSyncingContentSequence = IsSyncingContentSequence;
  }
  // Content files
  private areChapterContentFilesLoading: boolean = false;
  public get AreChapterContentFilesLoading() {
    return this.areChapterContentFilesLoading;
  }
  private isNodeContentFileLoading: boolean = false;
  public get IsNodeContentFileLoading() {
    return this.isNodeContentFileLoading;
  }
  private isNodeAttachmentsLoading: boolean = false;
  public get IsNodeAttachmentsLoading() {
    return this.isNodeAttachmentsLoading;
  }
  private isContentSaving: boolean = false;
  public get IsContentSaving() {
    return this.isContentSaving;
  }
  public get IsContentLoading() {
    return this.AreChapterContentFilesLoading || this.IsNodeContentFileLoading || this.IsContentSaving;
  }

  // Content Styles
  private areStylesLoading: boolean = false;
  public get AreStylesLoading() {
    return this.areStylesLoading;
  }
  public set AreStylesLoading(value: boolean) {
    this.areStylesLoading = value;
  }

  /* ----- General Status ----- */
  private isLightMode: boolean = false;
  public get IsLightMode() {
    this.isLightMode = localStorage.getItem("isLightMode") === "true" ? true : false;
    return this.isLightMode;
  }
  private set IsLightMode(mode: boolean) {
    if (mode) {
      localStorage.setItem("isLightMode", "true");
      this.isLightMode = true;
    } else {
      localStorage.removeItem("isLightMode");
      this.isLightMode = false;
    }
  }
  public ToggleIsLightMode() {
    this.IsLightMode = !this.IsLightMode;
  }

  // TODO: Do you really need a User and a Token ?*
  private user?: User = undefined;
  get User() {
    return this.user;
  }
  set User(user: User | undefined) {
    this.user = user;
  }
  private visitedUser?: User = undefined;
  get VisitedUser() {
    return this.visitedUser;
  }
  set VisitedUser(visitedUser: User | undefined) {
    this.visitedUser = visitedUser;
  }

  // Records
  private records: Content[] = [];
  get Records() {
    return this.records;
  }
  set Records(records: Content[]) {
    this.records = records;
  }

  /* ----- File management ----- */
  private chapterFiles: Record<string, Blob> = {}; // A record of Chapter IDs and their files data (including data of children)
  private resources: Record<string, Resource> = {}; // A record of Resource File Names and the Resource itself
  public get JsResources() {
    return Object.values(this.resources)
      .filter((r) => r.type === resourcetype.JS)
      .sort((a, b) => {
        if (a.order && b.order) return a.order - b.order;
        if (a.order) return -1;
        if (b.order) return 1;
        return 0;
      });
  }

  public get SvgResources() {
    return Object.values(this.resources)
      .filter((r) => r.type === resourcetype.SVG)
      .sort((a, b) => {
        if (a.order && b.order) return a.order - b.order;
        if (a.order) return -1;
        if (b.order) return 1;
        return 0;
      });
  }

  public get CssResources() {
    return Object.values(this.resources)
      .filter((r) => r.type === resourcetype.CSS)
      .sort((a, b) => {
        if (a.order && b.order) return a.order - b.order;
        if (a.order) return -1;
        if (b.order) return 1;
        return 0;
      });
  }

  public GetResourceByFileName(fileName: string): Resource | undefined {
    return this.resources[fileName];
  }

  private selectedNode: SelectedContent | undefined = undefined;
  get SelectedNode() {
    return this.selectedNode;
  }
  set SelectedNode(value: SelectedContent | undefined) {
    this.selectedNode = value;
    if (value?.id !== this.contentNodeBefore?.id) {
      // Ensure the new & edit content forms are closed on selected node change
      this.CloseNewContentForm();
      this.CloseEditContentForm();
    }
    if (this.IsEditMode) this.fetchCurrentNodeContent();
    // set the chapter
    let selectedNodeChapter: Content | undefined = value;
    // Traverse up the tree to find the tree level 1 node
    while (selectedNodeChapter && selectedNodeChapter.treeLevel !== 1) selectedNodeChapter = selectedNodeChapter.parent;
    if (!selectedNodeChapter) return; // Do not fetch content if the chapter is already selected
    this.SelectedChapter = { ...selectedNodeChapter, attachments: {} };
    this.DrawerSize === "full" && (this.DrawerSize = "large"); // Set size to large if drawer is fully expanded (to show fetched content)
  }

  private selectedChapter: SelectedContent | undefined = undefined;
  get SelectedChapter() {
    return this.selectedChapter;
  }
  set SelectedChapter(value: SelectedContent | undefined) {
    if (this.selectedChapter?.id === value?.id) return;
    this.selectedChapter = value;
    if (value) {
      this.AreStylesLoading = true;
      this.FetchChapterContents();
    }
  }

  /**
   * Computed property for selectedNodeChapterFileUrl.
   * Generates a URL if selectedNodeChapterId exists in the chapterFiles map. */
  get selectedNodeChapterFileUrl(): string | undefined {
    // Ensure children of root (i.e., Chapters) exist
    if (!(this.Records[0].children && this.Records[0].children.length > 0)) {
      return undefined;
    }
    if (!this.SelectedChapter) {
      this.AddError("No chapter ID for the selected node yet");
      return undefined;
    }
    if (this.AreChapterContentFilesLoading) {
      this.AddError("Chapter content files are loading");
      return undefined;
    }
    if (!this.AreChapterContentFilesAvailable(this.SelectedChapter.id)) {
      return undefined;
    }
    const blob = this.GetChapterContentFiles;
    if (!blob) {
      this.AddError("No blob for the chapter content of the selected node");
      return undefined;
    }
    return URL.createObjectURL(blob);
  }

  private tinyMceEditorRef: React.RefObject<TinyMCEEditor | null> | undefined = undefined;
  get TinyMceEditorRef() {
    return this.tinyMceEditorRef;
  }
  set TinyMceEditorRef(value: React.MutableRefObject<TinyMCEEditor | null> | undefined) {
    this.tinyMceEditorRef = value;
  }

  private tinyMceInitialContentRef: React.RefObject<string | null> | undefined = undefined;
  get TinyMceInitialContentRef() {
    return this.tinyMceInitialContentRef;
  }
  set TinyMceInitialContentRef(value: React.MutableRefObject<string | null> | undefined) {
    this.tinyMceInitialContentRef = value;
  }

  // Trackers for HTML in the editor
  private isDirty: boolean = false;
  public get IsDirty() {
    return this.isDirty;
  }
  public set IsDirty(isDirty: boolean) {
    this.isDirty = isDirty;
  }
  private currentHtml: string | undefined = undefined;
  public get CurrentHtml() {
    return this.currentHtml;
  }
  public set CurrentHtml(currentHtml: string | undefined) {
    this.currentHtml = currentHtml;
  }

  private selectedAttachment: Attachment | undefined = undefined;
  get SelectedAttachment(): Attachment | undefined {
    return this.selectedAttachment;
  }
  set SelectedAttachment(value: Attachment | undefined) {
    this.selectedAttachment = value;
  }

  // Main Drawer type management (inline, or overlay)
  private drawerType: DrawerType = "inline";
  public get DrawerType() {
    return this.drawerType;
  }
  public set DrawerType(value: DrawerType) {
    this.drawerType = value;
    this.AreStylesLoading = true;
  }

  // Tree's Drawer size management (open/close)
  private drawerSize: DrawerSize = "large";
  public get DrawerSize() {
    return this.drawerSize;
  }
  public set DrawerSize(value: DrawerSize) {
    this.drawerSize = value;
  }

  /**
   * A map tracking the currently expanded node IDs for each tree "level".
   * - Key: a string representing the branch depth (e.g., "root", "root-<parentId>").
   * - Value: the set of IDs of the expanded nodes at that level.
   *
   * This ensures that at any given depth, only one node can be open.
   * Changing a branch at one level automatically collapses all deeper levels.
   */
  private openBranchState: Record<string, Set<Guid>> = {};
  public get OpenBranchState(): Record<string, Set<Guid>> {
    return this.openBranchState;
  }
  public get HasOpenBranchesExceptSelected(): boolean {
    return Object.values(this.openBranchState).some((set) => set.size > 1);
  }

  private isEditMode: boolean = false;
  public get IsEditMode() {
    return this.isEditMode;
  }
  public set IsEditMode(value: boolean) {
    this.isEditMode = value;
    // Close any form, if exist
    this.CloseNewContentForm();
    this.CloseEditContentForm();
    // Set size to large if drawer is fully expanded (to show fetched content)
    this.DrawerSize === "full" && (this.DrawerSize = "large");
    if (value) this.fetchCurrentNodeContent();
    else {
      this.FetchChapterContents(true);
      this.CurrentHtml = undefined;
    }
  }

  public ToggleEditMode() {
    this.IsEditMode = !this.IsEditMode;
  }

  private async fetchCurrentNodeContent(entireFile: boolean = false) {
    if (!this.SelectedNode) {
      this.AddError("No node selected for editing");
      return;
    }
    this.isNodeContentFileLoading = true;
    this.isNodeAttachmentsLoading = true;
    const [attachmentsRes, contentRes] = await Promise.all([
      this.cdsService.fetchAttachments(this.SelectedNode.id),
      this.cdsService.fetchContent(this.SelectedNode, false),
    ]);
    // attachmentsRes
    if (attachmentsRes.error) {
      this.AddError(attachmentsRes.error.message);
      this.isNodeAttachmentsLoading = false;
      return;
    }
    attachmentsRes.data.map((attachment) => {
      if (this.SelectedNode) this.SelectedNode.attachments[attachment.guid] = attachment;
    });
    this.isNodeAttachmentsLoading = false;
    // contentRes
    if (contentRes.error) {
      this.AddError(contentRes.error.message);
      this.isNodeContentFileLoading = false;
      return;
    }
    let content = contentRes.data;
    if (!entireFile && content) {
      const $ = load(content);
      const editableDiv = $(`div[id="editable_${this.SelectedNode.id}"]`);
      // Get the content of the editable div
      const editableDivContent = editableDiv.html();
      // Ensure the editable div is found
      if (editableDiv.length > 0 && editableDivContent) {
        // Set the content to the editable div
        content = editableDivContent;
      }
    }
    this.SelectedNode.htmlContent = content;
    if (!entireFile) this.CurrentHtml = content;
    this.isNodeContentFileLoading = false;
  }

  public async FetchChapterContents(refetch?: boolean) {
    if (!this.SelectedChapter) {
      this.AddError("No chapter ID for the selected node");
      return;
    }
    if (this.AreChapterContentFilesAvailable(this.SelectedChapter.id) && !refetch) return;
    this.areChapterContentFilesLoading = true;
    // Fetch the content for the chapter
    const res = await this.cdsService.fetchContent(this.SelectedChapter, true);
    if (!this.SelectedChapter?.id) {
      this.AddError("No chapter ID for the selected node");
      return;
    }
    if (res.error) {
      this.AddError(res.error.message);
      this.areChapterContentFilesLoading = false;
      return;
    }
    // check if the content is an HTML doc or just the body contents
    if (res.data && !res.data.startsWith("<!DOCTYPE html>") && !res.data.startsWith("<html>")) {
      this.ChapterContentFiles = [
        `<!DOCTYPE html>`,
        `<html>`,
        `  <head>`,
        // the base has to be inserted before the load event of the viewer's iframe
        // this sets the base url for use in the rendered document's tags
        `    <base href="${this.ClientUrl}/">`,
        `  </head>`,
        `  <body>`,
        `    ${res.data}`,
        `  </body>`,
        `</html>`,
      ].join("");
    }
    // Store the chapter content in the VM
    this.areChapterContentFilesLoading = false;
  }

  private isResequencingMode: boolean = false;
  public get IsResequencingMode() {
    return this.isResequencingMode;
  }
  public set IsResequencingMode(value: boolean) {
    this.isResequencingMode = value;
    // Close the any form, if exist
    this.CloseNewContentForm();
    this.CloseEditContentForm();
  }

  private backupRecords: Content[] = [];

  public async ToggleResequencingMode() {
    if (!this.IsResequencingMode) {
      // Backup the current ordering when entering resequencing mode
      this.backupRecords = JSON.parse(JSON.stringify(this.Records));
      this.IsResequencingMode = true;
    } else {
      // When saving changes, sync the new sequence
      await this.SyncContentSequence();
      this.IsResequencingMode = false;
      this.backupRecords = [];
    }
    this.forceUpdate();
  }

  public RevertResequencingChanges() {
    if (this.backupRecords.length > 0) {
      // Revert Records to the backup copy
      this.Records = JSON.parse(JSON.stringify(this.backupRecords));
    }
    this.IsResequencingMode = false;
    this.DidSequenceChange = false;
    this.backupRecords = [];
    this.forceUpdate();
  }

  private didSequenceChange: boolean = false;
  public get DidSequenceChange() {
    return this.didSequenceChange;
  }
  public set DidSequenceChange(value: boolean) {
    this.didSequenceChange = value;
  }

  // The client URL derived from the context
  private clientUrl?: string = undefined;
  public get ClientUrl() {
    return this.clientUrl;
  }
  public set ClientUrl(value: string | undefined) {
    this.clientUrl = value;
  }

  // Course category ID derived from the context
  private _courseCategoryGuid?: string = undefined;
  private get courseCategoryGuid() {
    return this._courseCategoryGuid;
  }
  private set courseCategoryGuid(value: string | undefined) {
    this._courseCategoryGuid = value;
  }

  // Course category code derived from the context
  private _subjectCode?: string;
  public get SubjectCode(): string | undefined {
    return this._subjectCode;
  }
  public set SubjectCode(value: string | undefined) {
    this._subjectCode = value?.trim() || undefined;
  }
  public get SubjectCodeFirstThree(): string | undefined {
    return this._subjectCode?.substring(0, 3);
  }

  // Course category code derived from the context
  private _subjectUseRefId: boolean = false;
  public get SubjectUseRefId(): boolean {
    return this._subjectUseRefId;
  }
  public set SubjectUseRefId(value: boolean) {
    this._subjectUseRefId = value;
  }

  private canUserEdit: boolean = false;
  public get CanUserEdit(): boolean {
    return this.canUserEdit;
  }

  // The Content node before which the new form will open
  private contentNodeBefore?: Content = undefined;
  public get ContentNodeBefore(): Content | undefined {
    return this.contentNodeBefore;
  }

  // The tree level of the new node form that's currently active
  private formTreeLevel: number | undefined = undefined;
  public get FormTreeLevel() {
    return this.formTreeLevel;
  }
  public set FormTreeLevel(treeLevel: number | undefined) {
    this.formTreeLevel = treeLevel;
    if (treeLevel === undefined) {
      this.contentNodeBefore = undefined; // Clear contentNodeBefore
      this.CurrentFormSubTreeLevel = undefined; // Clear CurrentFormSubTreeLevel
    }
    if (this.forceUpdate) this.forceUpdate(); // Notify observers
  }

  private currentFormSubTreeLevel: number | undefined = undefined;
  public get CurrentFormSubTreeLevel() {
    return this.currentFormSubTreeLevel;
  }
  public set CurrentFormSubTreeLevel(subTreeLevel: number | undefined) {
    this.currentFormSubTreeLevel = subTreeLevel;
  }

  // State for the content node being edited
  private _editNode: Content | undefined = undefined;
  public get EditNode() {
    return this._editNode;
  }
  private set editNode(editNode: Content | undefined) {
    this._editNode = editNode;
    if (editNode === undefined) {
      this.CurrentFormSubTreeLevel = undefined; // Clear CurrentFormSubTreeLevel
    }
  }

  // Regular expression to match the "XXX XX XX 00" format
  private readonly _refIdPattern = /^\d{3} \d{2} \d{2} \d{2} 00$/;
  public get RefIdPattern() {
    return this._refIdPattern;
  }

  // Unique ID for the style element to fix TinyMCE aux panel z-index
  private STYLE_ID = "pcf-tiny-aux-fix";

  constructor(serviceProvider: ServiceProvider) {
    // Initialize dependencies and context
    this.serviceProvider = serviceProvider;
    this.cdsService = serviceProvider.get(CdsService.serviceName);
    // Make this class observable for MobX
    makeAutoObservable(this);
    this.init();
  }

  /**
   * Sets a general application error.
   * @param errorMessage The error message to set.
   */
  public SetAppError(errorMessage: string | undefined) {
    this.PcfError = errorMessage;
    if (this.forceUpdate) this.forceUpdate();
  }

  /**
   * Pushs an error message specific to content operations.
   * @param errorMessage The error message to push.
   */
  public AddError(errorMessage: string) {
    const id = this.errorCounter++;
    this.ErrorMessages.set(id, errorMessage);
    if (errorMessage) console.error(errorMessage);
    return id;
  }
  public DismissError(errorIdx: number) {
    this.ErrorMessages.delete(errorIdx);
  }
  public ClearErrors() {
    this.ErrorMessages.clear();
  }

  // User Authentication's Token
  public GetToken() {
    return localStorage.getItem("token") || undefined;
  }
  public SetToken(token: string | undefined) {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }

  /**
   * Initializes the control.
   */
  public async init() {
    this.IsLoading = true;
    console.info("AT v0.9.3");

    this.ClientUrl = this.cdsService.ClientUrl;

    //TODO get these values from backend
    // this.SubjectCode = subjectCode;
    // this.SubjectUseRefId = subjectUseRefId;
    // this.courseCategoryGuid = this.context.mode.contextInfo.entityId;

    const token = this.GetToken();
    if (!token) {
      console.warn("No token found, user is not authenticated");
      this.IsLoading = false;
      return;
    }
    if (!this.courseCategoryGuid) {
      this.SetAppError("courseCategoryGuid is undefined");
      this.isLoading = false;
      return;
    }
    try {
      const [treeRes, resourceRes, privilegeRes, _checkAuthRes] = await Promise.all([
        this.cdsService.fetchTree(this.courseCategoryGuid),
        this.cdsService.fetchSubjectResources(this.courseCategoryGuid),
        this.cdsService.checkUserPrivileges(),
        this.checkAuthStatus(token),
      ]);
      if (treeRes.error) {
        this.AddError(treeRes.error.message);
        this.isLoading = false;
        return;
      }
      if (resourceRes.error) {
        this.AddError(resourceRes.error.message);
        this.isLoading = false;
        return;
      }
      if (privilegeRes.error) {
        this.AddError(privilegeRes.error.message);
        this.canUserEdit = false;
      } else {
        this.canUserEdit = privilegeRes.data;
      }
      this.Records = [treeRes.content];
      // Ensure the first tree level 1 node is selected if no node is selected
      if (!this.SelectedNode) {
        let firstTreeLevel1Node =
          this.Records[0].treeLevel === 0 // Check if the root node is a tree level 0 node
            ? this.Records[0].children && this.Records[0].children[0]
            : this.Records[0];
        if (firstTreeLevel1Node) this.SelectedNode = { ...firstTreeLevel1Node, attachments: {} };
      }
      this.resources = resourceRes.data;
      const doc = document; // this is the current document
      if (!doc.getElementById(this.STYLE_ID)) {
        const style = doc.createElement("style");
        style.id = this.STYLE_ID;
        style.textContent = ".tox-tinymce-aux{z-index:1000001!important}";
        doc.head.appendChild(style);
      }
      this.isLoading = false;
    } catch (e: any) {
      this.AddError(`Error fetching content tree: ${e.message}`);
      this.isLoading = false;
    } finally {
      this.IsLoading = false;
    }
  }

  private async checkAuthStatus(token: string) {
    const res: CdsResponse<User> = await this.cdsService.CheckAuthStatus(token);
    if (res.error) {
      this.AddError(res.error.message);
      return;
    }
    this.User = res.data;
  }

  public async Register(registerState: { username: string; email: string; password: string; confirmPassword: string }) {
    if (registerState.password !== registerState.confirmPassword) {
      const message = "Passwords must match.";
      this.AddError(message);
      return;
    }
    const res: CdsResponse<User> = await this.cdsService.Register(
      registerState.username,
      registerState.email,
      registerState.password
    );
    if (res.error) {
      this.AddError(res.error.message);
      return;
    }
    this.User = res.data;
    this.SetToken(res.data.token);
  }

  public async Login(username: string, password: string) {
    const res: CdsResponse<User> = await this.cdsService.Login(username, password);
    if (res.error) {
      this.AddError(res.error.message);
      return;
    }
    this.User = res.data;
    this.SetToken(res.data.token);
  }

  public async Logout() {
    const token = this.GetToken();
    if (!token) {
      console.warn("No token found, user is not authenticated");
      return;
    }
    const res: CdsResponse<void> = await this.cdsService.Logout(token);
    if (res.error) {
      this.AddError(res.error.message);
      return;
    }
    this.SetToken(undefined);
    this.User = undefined;
  }

  public set ChapterContentFiles(chapterHtml: string) {
    const chapterId = this.SelectedChapter?.id;
    if (!chapterId || chapterId === "undefined") {
      this.AddError("the provided chapter ID string is empty");
      return;
    }
    if (!chapterHtml || chapterHtml === "undefined") {
      this.AddError("the provided chapter files string is empty");
      return;
    }
    const chapterBlob = new Blob([chapterHtml], { type: "text/html" });
    this.chapterFiles[chapterId] = chapterBlob;
  }

  public get GetChapterContentFiles(): Blob | undefined {
    const chapterId = this.SelectedChapter?.id;
    if (!chapterId) return undefined;
    if (this.AreChapterContentFilesAvailable(chapterId)) {
      const blob: Blob = this.chapterFiles[chapterId];
      return blob;
    }
    return undefined;
  }

  public AreChapterContentFilesAvailable(chapterId: string): boolean {
    return chapterId in this.chapterFiles && this.chapterFiles[chapterId] !== undefined;
  }

  public isSubjectResourceAvailable(fileName: string): boolean {
    return fileName in this.resources && this.resources[fileName] !== undefined;
  }

  /**
   * Expands or collapses a branch at the given `level`.
   * - If `close` is provided, simply removes the id from the set at `level`.
   * - If `close` is not provided, adds the id to the set at `level` (to expand the node).
   *
   * Step-by-step:
   * 1. Ensure `openBranchState[level]` is initialized as a Set if it doesn't exist.
   * 2. If `close` is true, remove the `id` from the set at `level`.
   * 3. If `close` is false, add the `id` to the set at `level`.
   */
  public UpdateOpenBranch(level: string, id: string, close: boolean = false) {
    this.openBranchState[level] = this.openBranchState[level] || new Set<Guid>(); // Initialize if not present
    if (close) this.openBranchState[level].delete(id); // If closing, just clear the branch at this level
    else this.openBranchState[level].add(id); // If opening, ensure this branch is added
  }

  /**
   * Expands all branches in the content tree.
   * - This method traverses the entire tree and expands all nodes.
   */
  public ExpandAll() {
    if (!(this.Records[0].children && this.Records[0].children.length > 0)) {
      this.AddError("No children found in the root content node to expand");
      return;
    }
    this.Records[0].children.forEach((record) => {
      const traverse = (level: string, node: Content) => {
        this.UpdateOpenBranch(level, node.id); // Expand the current node
        if (node.children && node.children.length > 0) node.children.forEach((child) => traverse(level + 1, child)); // Recursively expand children
      };
      traverse("root", record); // Start traversing from the roots
    });
  }

  /**
   * Collapses all branches by resetting the open branch state.
   * - This effectively closes all expanded nodes in the tree.
   */
  public CollapseAll() {
    // Explicitly clear all Sets in the record (it is done this way to avoid dependency issues)
    Object.keys(this.openBranchState).forEach((key) => this.openBranchState[key].clear());
    this.expandSelectedNodeBranch(); // Ensure the selected node's branch is expanded
  }

  /**
   * Expands the branch of the currently selected node.
   * - This method collects all parent nodes from the selected node up to the root
   *   and expands them in order.
   * - If there are less than 2 parents, it does nothing (as we need at least a parent and a grandparent).
   */
  private expandSelectedNodeBranch() {
    if (!this.SelectedNode) return;
    // Collect all parents from the selected node up to the root
    const parents: Content[] = [];
    let current: Content | undefined = this.SelectedNode;
    while (current) {
      parents.unshift(current); // Add to beginning to maintain order from root to selected
      current = current.parent;
    }
    // If there are less than 2 parents, nothing to expand (need at least 2 to have a "second grandparent" -from top-)
    if (parents.length < 2) return;
    // Start from the second parent (index 1) and expand downwards
    let levelPath = "root"; // Start with "root" for the first expanded node
    for (let i = 1; i < parents.length; i++) {
      this.UpdateOpenBranch(levelPath, parents[i].id);
      levelPath += "1"; // Append "1" for each subsequent level
    }
  }

  public MoveNodeUp(nodeId: string): void {
    const { siblings, index } = this.FindNodeAndSiblings(nodeId);
    if (siblings && index > 0) {
      // Remove the node from its current position...
      const [movedNode] = siblings.splice(index, 1);
      // ...and insert it at the previous index.
      siblings.splice(index - 1, 0, movedNode);
      // Mark that the sequence has changed
      this.DidSequenceChange = true;
      this.forceUpdate();
    }
  }

  /**
   * Moves a node down in the order within the same level.
   * @param nodeId The ID of the node to move down.
   */
  public MoveNodeDown(nodeId: string): void {
    const { siblings, index } = this.FindNodeAndSiblings(nodeId);
    if (siblings && index < siblings.length - 1) {
      // Remove the node from its current position...
      const [movedNode] = siblings.splice(index, 1);
      // ...and insert it at the next index.
      siblings.splice(index + 1, 0, movedNode);
      // Mark that the sequence has changed
      this.DidSequenceChange = true;
      this.forceUpdate();
    }
  }

  /**
   * Finds a node and its siblings within the Records tree structure.
   * @param nodeId The ID of the node to find.
   * @returns An object containing the parent node, siblings, and index of the node.
   */
  public FindNodeAndSiblings(nodeId: string): {
    parent: Content | null;
    siblings: Content[] | null;
    index: number;
  } {
    let parent: Content | null = null;
    let siblings: Content[] | null = null;
    let index: number = -1;
    const traverse = (nodes: Content[], parentNode: Content | null) => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === nodeId) {
          parent = parentNode;
          siblings = parentNode ? parentNode.children || [] : this.Records;
          index = i;
          return;
        }
        if (nodes[i].children) {
          traverse(nodes[i].children!, nodes[i]);
        }
      }
    };
    traverse(this.Records, null);
    return { parent, siblings, index };
  }

  /**
   * Ensure the order of the Content tree nodes is based on DFS (Depth-First Sequence)
   */
  private ensureDFSOrder(): void {
    let orderCounter = 0;
    const assignOrder = (nodes: Content[]) => {
      nodes.forEach((node) => {
        // Assign a new order to the node.
        node.order = orderCounter++;
        // Assing the new path to the node with tree level other than 0
        if (node.treeLevel > 0) this.UpdateNodePath(node, node.parent?.path || "");
        if (node.children && node.children.length > 0) {
          assignOrder(node.children);
        }
      });
    };
    assignOrder(this.Records);
  }

  /**
   * Finds a node by its ID in the nested structure of this.Records.
   * @param nodeId The ID of the node to find.
   * @returns The node if found, or null otherwise.
   */
  public findNodeById(nodeId: string): Content | null {
    const traverse = (nodes: Content[]): Content | null => {
      for (const node of nodes) {
        if (node.id === nodeId) {
          return node;
        }
        if (node.children) {
          const found = traverse(node.children);
          if (found) return found;
        }
      }
      return null;
    };
    return traverse(this.Records);
  }

  /**
   * Finds the previous sibling of a given parent node.
   * @param parentId The ID of the parent node.
   * @returns The previous sibling node, or null if none exists.
   */
  public findPreviousSibling(parentId: string): Content | null {
    const { siblings, index } = this.FindNodeAndSiblings(parentId);
    return index > 0 ? siblings![index - 1] : null;
  }

  /**
   * Finds the next sibling of a given parent node.
   * @param parentId The ID of the parent node.
   * @returns The next sibling node, or null if none exists.
   */
  public findNextSibling(parentId: string): Content | null {
    const { siblings, index } = this.FindNodeAndSiblings(parentId);
    return index < siblings!.length - 1 ? siblings![index + 1] : null;
  }

  public UpdateNodePath(node: Content, newParentPath: string, includeChildren: boolean = true) {
    if (!node) return;
    // Clean up the parent's path to remove the trailing HTML reference
    const cleanedParentPath = newParentPath?.toLowerCase().endsWith("html") // Assuming the last segment ending in .html from the parent's path
      ? newParentPath.split("\\").slice(0, -1).join("\\") // Remove the last segment that ends with .html
      : newParentPath ?? null; // Keep it as is if it doesn't end with .html
    // Update the node's path
    const nodeReference = `L${node.treeLevel}O${node.order}`;
    // Construct the new path based on the cleaned parent path
    node.path = cleanedParentPath
      ? `${cleanedParentPath}\\${nodeReference}\\${nodeReference}.html`
      : node.parent
      ? `L${node.parent.treeLevel}O${node.parent.order}\\${nodeReference}\\${nodeReference}.html`
      : `${nodeReference}\\${nodeReference}.html`;
    // Recursively update the paths of the children
    if (includeChildren && node.children) node.children.forEach((child) => this.UpdateNodePath(child, node.path || ""));
  }

  /**
   * Moves a node to the previous parent's last child if it's the first node.
   * @param nodeId The ID of the node to move.
   */
  public MoveNodeToPreviousParent(nodeId: string): void {
    const { parent, siblings, index } = this.FindNodeAndSiblings(nodeId);
    if (!parent || index !== 0) return;
    const previousParent = this.findPreviousSibling(parent.id);
    if (!previousParent || !previousParent.children) return;
    const [node] = siblings!.splice(index, 1); // Remove node from current siblings
    previousParent.children.push(node); // Add to the end of the previous parent's children
    node.parentId = previousParent.id;
    node.parent = previousParent;
    // Update the node and its children
    this.UpdateNodePath(node, previousParent.path || "");
    this.DidSequenceChange = true;
    this.forceUpdate();
  }

  /**
   * Moves a node to the next parent's first child if it's the last node.
   * @param nodeId The ID of the node to move.
   */
  public MoveNodeToNextParent(nodeId: string): void {
    const { parent, siblings, index } = this.FindNodeAndSiblings(nodeId);
    if (!parent || index !== siblings!.length - 1) return;
    const nextParent = this.findNextSibling(parent.id);
    if (!nextParent || !nextParent.children) return;
    const [node] = siblings!.splice(index, 1); // Remove node from current siblings
    nextParent.children.unshift(node); // Add to the beginning of the next parent's children
    node.parentId = nextParent.id;
    node.parent = nextParent;
    // Update the node and its children
    this.UpdateNodePath(node, nextParent.path || "");
    this.DidSequenceChange = true;
    this.forceUpdate();
  }

  /**
   * Syncs the content sequence changes (both new nodes and updates to existing nodes)
   * by calling saveContentSequence method from CdsService.
   * Once the batch completes, the in-memory tree is updated,
   * and any sequence changes are synced.
   */
  public async SyncContentSequence(): Promise<void> {
    this.isSyncingContentSequence = true;
    // Ensure a change exists
    if (!this.DidSequenceChange) {
      this.isSyncingContentSequence = false;
      return;
    }
    try {
      // Ensure the order of the Content tree nodes is based on DFS (Depth-First Sequence)
      this.ensureDFSOrder();
      // Ensure the Subject's Guid is valid
      if (!this.courseCategoryGuid) {
        this.AddError(`No Course Category Guid`);
        this.isSyncingContentSequence = false;
        return;
      }
      // Call the saveContentSequence method from CdsService,
      // passing in the root content nodes (this.Records) and the Subject's Guid.
      const res = await this.cdsService.SaveContentSequence(this.Records);
      // Ensure no errors
      if (res.error) throw new Error(`Error saving resequenced content: ${res.error.message}`);
      // TODO: Improve using result.data
      // Update the records to be the same as on the database
      const treeRes = await this.cdsService.fetchTree(this.courseCategoryGuid);
      if (treeRes.error) throw new Error(treeRes.error.message);
      this.Records = [treeRes.content];
      // Refetch chapter in preview mode, if opened
      if (this.selectedNodeChapterFileUrl) await this.FetchChapterContents(true);
      // Reset the flags indicating that changes have occurred.
      this.DidSequenceChange = false;
    } catch (error) {
      this.AddError(`Error: ${error}`);
    } finally {
      this.isSyncingContentSequence = false;
    }
  }

  /**
   * Opens the "New Content" form for the given contentNodeBefore and node type.
   * @param contentNodeBefore The existing Content item before which to add a new one.
   * @param treeLevel The form's tree level to display.
   */
  public OpenNewContentForm(contentNodeBefore: Content, treeLevel: number) {
    this.CloseNewContentForm(); // close any new-node forms
    this.CloseEditContentForm(); // close any edit form
    this.contentNodeBefore = contentNodeBefore;
    this.FormTreeLevel = treeLevel;
  }
  /**
   * Closes the "New Content" form.
   *
   * Clears both FormType and ContentNodeBefore.
   */
  public CloseNewContentForm() {
    this.FormTreeLevel = undefined;
  }

  /**
   * Opens the edit form for a given node.
   * @param node - The content node to edit
   */
  public OpenEditContentForm(node: Content) {
    this.CloseEditContentForm(); // close any edit form
    this.CloseNewContentForm(); // close any new-node forms
    this.editNode = JSON.parse(JSON.stringify(node)); // Deep Copy
  }
  /**
   * Ensure the edit form of the content node is closed
   */
  public CloseEditContentForm() {
    this.editNode = undefined;
  }

  /**
   * Update an existing content node on server and locally
   */
  public async UpdateContentNode(updated: Content): Promise<void> {
    try {
      this.isContentSaving = true;
      this.isLoading = true;
      const updateRes = await this.cdsService.UpdateContentNode(updated);
      if (updateRes.error) throw updateRes.error;
      // Find the target node by id
      const target = this.findNodeById(updated.id);
      if (!target) throw Error(`Node with ID ${updated.id} not found.`);
      // if the reference ID is used (required), update the content file
      if (this.SubjectUseRefId) {
        if (!target.referenceID)
          throw new Error("Reference ID is required but not found in the targeted node to update.");
        // Update the reference id in the content file
        const isFileUpdated = await this.updateContentNodeFile(updated, target.referenceID);
        if (!isFileUpdated) {
          // Revert the changes if the file update faild
          const revertRes = await this.cdsService.UpdateContentNode(target);
          if (revertRes.error) throw revertRes.error;
        }
      }
      // Apply local changes
      target.name = updated.name;
      target.referenceID = updated.referenceID;
      // Refetch chapter in preview mode, if opened
      if (this.selectedNodeChapterFileUrl) await this.FetchChapterContents(true);
      this.forceUpdate();
    } catch (error: any) {
      this.AddError(`Error updating node: ${error.message}`);
    } finally {
      this.isContentSaving = false;
      this.isLoading = false;
    }
  }

  public async DeleteContentNode(nodeToDelete: Content): Promise<void> {
    try {
      this.isContentSaving = true;
      this.isLoading = true;
      // Clear selected node if it matches the one being deleted
      if (this.SelectedNode?.id === nodeToDelete.id) this.SelectedNode = undefined;
      // Clear selected chapter if it matches the one being deleted
      if (this.SelectedChapter?.id === nodeToDelete.id) this.SelectedChapter = undefined;
      // Delete from server
      const res = await this.cdsService.DeleteContentNode(nodeToDelete);
      if (res.error) {
        const parsedError = this.parseDeleteError(res.error.message);
        this.AddError(parsedError);
        return;
      }
      // Remove node locally
      const removeRecursively = (nodes: Content[]): Content[] =>
        nodes.filter((node) => {
          if (node.id === nodeToDelete.id) return false;
          if (node.children) node.children = removeRecursively(node.children);
          return true;
        });
      this.Records = removeRecursively(this.Records);
      // Refetch chapter in preview mode, if opened
      if (this.SelectedChapter && this.selectedNodeChapterFileUrl) this.FetchChapterContents(true);
      this.forceUpdate();
    } catch (error: any) {
      this.AddError(`Error deleting node: ${error.message}`);
    } finally {
      this.isContentSaving = false;
      this.isLoading = false;
    }
  }

  private parseDeleteError(errorMessage: string): string {
    // Regular expression to capture the main error details including multiple restricting entities
    const regex = /Restricting entity ([\w_]+) \(ObjectTypeCode: (\d+)\)/g;
    // Initialize variables to hold the match results
    let match;
    let userMessage = "";
    // First match for the main object that can't be deleted
    const mainObjectRegex = /Deleting records from ([\w_]+) \(ObjectTypeCode: (\d+)\)/;
    const mainObjectMatch = errorMessage.match(mainObjectRegex);
    const objectName = mainObjectMatch ? mainObjectMatch[1] : "the object";
    // Regular expression to capture the node ID
    const nodeIdRegex = /for Id\(s\) : ([a-f0-9-]+)/;
    const nodeIdMatch = errorMessage.match(nodeIdRegex);
    const nodeId = nodeIdMatch ? nodeIdMatch[1] : null; // Get the node ID from the error message
    // Collect all restricting entities, remove 'axa_' and format them
    let restrictingEntities = [];
    while ((match = regex.exec(errorMessage)) !== null) {
      const restrictingEntityName = match[1]; // e.g., axa_ExamTemplateRule
      // Remove the 'axa_' prefix and format the entity name
      const formattedEntityName = restrictingEntityName
        .replace("axa_", "")
        .replace(/([A-Z])/g, " $1")
        .trim();
      // Add the formatted entity to the list of restricting entities
      restrictingEntities.push(formattedEntityName);
    }
    // Construct the user-friendly message based on the restricting entities
    if (nodeId) {
      if (restrictingEntities.length > 0)
        userMessage = `The node with GUID: ${nodeId} could not be deleted because it is linked to the following entities: 
          ${restrictingEntities.join(", ")}.`;
      else
        userMessage = `An unknown error occurred while trying to delete the node with GUID: ${nodeId}. Please check for any dependencies.`;
    } else
      userMessage = `An unknown error occurred while trying to delete the ${objectName}. Please check for any dependencies.`;
    return userMessage;
  }

  /**
   * Create a new content node on server and insert locally
   */
  public async AddContentNode(newNode: Content, insertAfter?: Content): Promise<void> {
    try {
      this.isContentSaving = true;
      this.isLoading = true;
      if (!this.courseCategoryGuid) throw new Error("No Course Category Guid");
      const resNode = await this.cdsService.CreateContentNode(newNode, this.courseCategoryGuid);
      if (resNode.error) throw new Error(resNode.error.message);
      // Assign the real GUID returned from server
      newNode.id = resNode.data.id;
      const isFileCreated = await this.createContentNodeFile(newNode);
      if (!isFileCreated) await this.DeleteContentNode(newNode);
      // Insert into local tree
      const parent = newNode.parent ? this.findNodeById(newNode.parent.id) : undefined;
      if (parent) parent.children = parent.children || [];
      const siblings = parent ? parent.children! : this.Records;
      const index = insertAfter ? siblings.findIndex((n) => n.id === insertAfter.id) + 1 : siblings.length;
      siblings.splice(index, 0, newNode);
      // Select the newly created node (this is needed to later refetch the chapter in preview mode)
      this.SelectedNode = { ...newNode, attachments: {} };
      // Sync the sequence changes with the server
      this.DidSequenceChange = true;
      await this.SyncContentSequence(); // implicitly refetchs the chapter in preview mode, if opened
      this.forceUpdate();
    } catch (error: any) {
      this.AddError(`Error creating node: ${error.message}`);
    } finally {
      this.isContentSaving = false;
      this.isLoading = false;
    }
  }

  /**
   * Function to get the highest order value among all children of a content node
   */
  public GetHighestOrder(node: Content): number {
    let highestOrder = node.order; // Start with the current node's order

    // Check children and their order
    if (node.children) {
      node.children.forEach((child) => {
        highestOrder = Math.max(highestOrder, this.GetHighestOrder(child)); // Recursively find the highest order in children
      });
    }

    return highestOrder;
  }

  /**
   * Function to get the descendants count of a content node
   */
  public GetDescendantsCount(node: Content): number {
    let descendantsCount = 0; // Initialize the count of descendants
    const stack: Content[] = [node]; // Use a stack to traverse the tree (to avoid recursion limits)
    // Traverse the tree using a stack
    while (stack.length > 0) {
      const current = stack.pop()!; // Get the current node from the stack
      // If the current node has children, add them to the stack
      // and increment the descendants count by the number of children
      if (current.children) {
        descendantsCount += current.children.length; // Increment the count by the number of children
        stack.push(...current.children); // Add all children to the stack for further traversal
      }
    }
    return descendantsCount; // Return the total count of descendants
  }

  public fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      // Event listener for successful reading
      reader.onload = () => {
        if (reader.result) {
          // Ensure the result is a string
          const base64data = reader.result.toString();
          const base64content = base64data.split(",")[1]; // Remove the Data URL part
          resolve(base64content);
        } else {
          reject(new Error("Failed to convert file to Base64"));
        }
      };
      // Event listener for errors during reading
      reader.onerror = () => {
        reject(new Error("Error reading file"));
      };
      // Start reading the file as a Base64 string
      reader.readAsDataURL(file);
    });
  }

  public encodeWhitespace(urlWithWhiteSpace: string): string {
    return urlWithWhiteSpace.replace(/\s/g, "%20");
  }

  public RemoveKey<T, K extends keyof T>(record: T, key: K): Omit<T, K> {
    const { [key]: _, ...rest } = record;
    return rest;
  }

  public allKeysHaveValues<T>(record: Record<string, T>): boolean {
    return Object.values(record).every((value) => value !== undefined && value !== null);
  }

  // function to open file explorer to select file, and return the selected file
  private openFileExplorer(): Promise<File | undefined> {
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept =
        "image/png, image/jpg, image/jpeg, image/webp, video/mp4, audio/mp3, audio/mpeg, application/zip, application/x-zip-compressed";
      input.onchange = () => {
        const file = input.files?.[0];
        resolve(file);
      };
      // if the user cancels the file selection, resolve with undefined
      input.oncancel = () => {
        resolve(undefined);
      };
      input.click();
    });
  }

  private attachmentsDialogError?: string = undefined;
  get AttachmentsDialogError() {
    return this.attachmentsDialogError;
  }
  private set AttachmentsDialogError(value: string | undefined) {
    this.attachmentsDialogError = value;
  }

  private isAttachmentsDialogOpen: boolean = false;
  get IsAttachmentsDialogOpen() {
    return this.isAttachmentsDialogOpen;
  }
  set IsAttachmentsDialogOpen(value: boolean) {
    this.isAttachmentsDialogOpen = value;
  }

  public ToggleAttachmentsDialog() {
    this.IsAttachmentsDialogOpen = !this.IsAttachmentsDialogOpen;
  }

  public SetAttachmentsDialogError(errorMessage: string | undefined) {
    this.AttachmentsDialogError = errorMessage;
    if (this.forceUpdate) this.forceUpdate();
  }

  private isAttachmentsDialogLoading: boolean = false;
  public get IsAttachmentsDialogLoading(): boolean {
    return this.isAttachmentsDialogLoading;
  }
  public set IsAttachmentsDialogLoading(value: boolean) {
    this.isAttachmentsDialogLoading = value;
  }

  public async UploadAttachment() {
    //open file explorer to select file
    if (!this.SelectedNode) {
      this.SetAttachmentsDialogError("No selected node found");
      return;
    }
    this.IsAttachmentsDialogLoading = true;
    const file = await this.openFileExplorer();
    if (!file) {
      this.IsAttachmentsDialogLoading = false;
      return;
    }
    // Ensure file is not duplicate
    const isDuplicate = Object.values(this.SelectedNode.attachments).some(
      (attachment) => file.name == attachment.fileName
    );
    if (isDuplicate) {
      this.SetAttachmentsDialogError(`Error uploading attachment: duplicate file`);
      this.IsAttachmentsDialogLoading = false;
      return;
    }
    const response = await this.cdsService.uploadContentAttachment(this.SelectedNode, file);
    if (response.error) {
      this.SetAttachmentsDialogError(`Error uploading attachment: ${response.error.message}`);
      this.IsAttachmentsDialogLoading = false;
      return;
    }
    // Add the newly set attachment to the this and items[]
    this.SelectedNode.attachments[response.data.guid] = response.data;
    this.IsAttachmentsDialogLoading = false;
  }

  public async DeleteAttachment(attachmentId: string) {
    this.IsAttachmentsDialogLoading = true;
    if (!this.SelectedNode) {
      this.IsAttachmentsDialogOpen = false;
      this.AddError("No selected node found");
      return;
    }
    this.IsAttachmentsDialogLoading = true;
    const response = await this.cdsService.deleteAttachment(attachmentId);
    if (response.error) {
      this.SetAttachmentsDialogError(response.error.message);
      this.IsAttachmentsDialogLoading = false;
      return;
    }
    // Remove the newly deleted attachment from the this and items[]
    delete this.SelectedNode.attachments[response.data.id];
    this.IsAttachmentsDialogLoading = false;
  }

  public InsertAttachment = (attachmentId: string, raw?: boolean, rawWidth?: number, rawHeight?: number) => {
    const editor = this.TinyMceEditorRef?.current;
    if (!editor) {
      this.SetAttachmentsDialogError("Unable to reference editor.");
      return;
    }
    const attachment = this.SelectedNode?.attachments[attachmentId];
    if (!attachment) {
      this.SetAttachmentsDialogError("Selected attachment doesn't exist or doesn't belong to the selected node.");
      return;
    }
    // these values are hardcoded for now, taken from the previous boeing content
    const height = 393;
    const width = 700;
    const clientPath = this.SelectedNode?.treeLevel ? "../".repeat(this.SelectedNode.treeLevel - 1) || "./" : "";
    // Generate content based on attachment type
    let content = "";
    switch (attachment.type) {
      case filetype.Image:
        if (raw) {
          // Without data-src it won't show in preview mode
          content = [
            `<img`,
            `  data-copyright`,
            `  data-media="image"`,
            `  data-src="${attachment.url}"`,
            `  src="${attachment.url}"`,
            `  data-client-src="${clientPath}images/${attachment.fileName}"`,
            `  data-id="${attachment.guid}"`,
            `  alt="${attachment.fileName}"`,
            `  style="`,
            `    display: block;`, // needed for margin auto centring
            `    max-width: 100%;`, // shrink to fit parent if necessary
            `    margin-inline: auto;`, // horizontal centring when it doesn't fill the line
            `    height: ${rawHeight ? rawHeight + "px" : "auto"};`, // raw height or preserve the natural aspect ratio
            rawWidth ? `    width: ${rawWidth + "px"};` : ``, // raw width
            `  "`,
            `/>`,
          ].join("");
          break;
        }
        // Without src it won't show in preview mode
        content = [
          `<figure>`,
          `  <div class="graphic_noborder">`,
          `    <img data-interactive="true" data-copyright data-media="image" data-src="${attachment.url}" data-client-src="${clientPath}images/${attachment.fileName}"`,
          `       data-id="${attachment.guid}" src="${attachment.url}" alt="${attachment.fileName}" width="${width}" height="${height}" style="object-fit: contain;" />`,
          `  </div>`,
          `  <figcaption>${attachment.fileName}</figcaption>`,
          `</figure>`,
        ].join("");
        break;
      case filetype.Video:
        content = [
          `<figure>`,
          `  <div class="psvideo">`,
          // add poster to the attachment
          `    <video data-interactive="true" data-media="video" loop width="${width}" height="${height}">`,
          `      <source data-src="${attachment.url}" data-client-src="${clientPath}videos/${attachment.fileName}" type="video/mp4" />`,
          `    </video>`,
          `  </div>`,
          `  <figcaption>${attachment.fileName}</figcaption>`,
          `</figure>`,
        ].join("");
        break;
      case filetype.Audio:
        content = [
          `<figure>`,
          `  <div class="psaudio">`,
          `    <audio data-interactive="true" controls="true" data-media="audio" preload="none">`,
          `      <source src="${attachment.url}" data-client-src="${clientPath}sounds/${attachment.fileName}" t type="audio/mpeg" />`,
          `      Your browser does not support the audio element.`,
          `    </audio>`,
          `  </div>`,
          `  <figcaption>${attachment.fileName}</figcaption>`,
          `</figure>`,
        ].join("");
        break;
      case filetype.InteractiveModel:
        content = [
          `<figure>`,
          `  <div class="pszoomer">`,
          `    <iframe`,
          `      width="${width}"`,
          `      height="${height}"`,
          `      frameborder="0"`,
          `      scrolling="no"`,
          `      allowfullscreen="true"`,
          `      webkitallowfullscreen="true"`,
          `      data-interactive="true"`,
          `      data-media="animation"`,
          `      data-src="${attachment.url}"`,
          `      data-client-src="${clientPath}attachments/${attachment.fileName}"`,
          `    >`,
          `    </iframe>`,
          `  </div>`,
          `  <figcaption>${attachment.fileName}</figcaption>`,
          `</figure>`,
        ].join("");
        break;
      default:
        content = `<a href="${attachment.url}" target="_blank">${attachment.fileName}</a>`;
        break;
    }
    // Insert the content into the editor
    editor.execCommand("InsertHTML", false, content);
    this.IsAttachmentsDialogOpen = false;
  };

  private latex: string = "";
  get Latex() {
    return this.latex;
  }
  set Latex(latex: string) {
    this.latex = latex;
  }

  private mathfieldRef: React.RefObject<MathfieldElement | null> | undefined = undefined;
  get MathfieldRef() {
    return this.mathfieldRef;
  }
  set MathfieldRef(value: React.MutableRefObject<MathfieldElement | null> | undefined) {
    this.mathfieldRef = value;
  }

  private mathDialogError?: string = undefined;
  get MathDialogError() {
    return this.mathDialogError;
  }
  private set MathDialogError(value: string | undefined) {
    this.mathDialogError = value;
  }

  private isMathDialogOpen: boolean = false;
  get IsMathDialogOpen() {
    return this.isMathDialogOpen;
  }
  set IsMathDialogOpen(value: boolean) {
    this.isMathDialogOpen = value;
  }

  public ToggleMathDialog(latex: string | null = null) {
    this.IsMathDialogOpen = !this.IsMathDialogOpen;
    this.Latex = latex || "";
  }

  public SetMathDialogError(errorMessage: string | undefined) {
    this.MathDialogError = errorMessage;
    if (this.forceUpdate) this.forceUpdate();
  }

  private isMathDialogLoading: boolean = false;
  public get IsMathDialogLoading(): boolean {
    return this.isMathDialogLoading;
  }
  public set IsMathDialogLoading(value: boolean) {
    this.isMathDialogLoading = value;
  }

  private formulaBookmark: Bookmark | undefined = undefined;
  public get FormulaBookmark(): Bookmark | undefined {
    return this.formulaBookmark;
  }
  public set FormulaBookmark(value: Bookmark | undefined) {
    this.formulaBookmark = value;
  }

  /**
   * Inserts a LaTeX equation into the TinyMCE editor after sanitizing the input
   * to prevent HTML injection and ensure proper formatting.
   */
  public InsertEquation = () => {
    const tinyMceEditor = this.TinyMceEditorRef?.current; // Get reference to TinyMCE editor instance
    // Validate TinyMCE editor reference exists
    if (!tinyMceEditor) {
      this.SetMathDialogError("Unable to reference Tiny MCE editor.");
      return;
    }
    const mathfield = this.MathfieldRef?.current; // Get reference to mathfield component
    // Validate mathfield reference exists
    if (!mathfield) {
      this.SetMathDialogError("Unable to reference mathfield.");
      return;
    }
    let latex = mathfield.getValue("latex"); // Extract raw LaTeX content from mathfield
    latex = tinyMceEditor.dom.encode(latex); // Encode to prevent HTML parsing of '<' '>' '&' etc.
    const content = [`<div class="formula" contenteditable="false">`, `${latex}`, `</div>`].join(""); // Generate formatted HTML content with formula wrapper
    try {
      tinyMceEditor.focus(); // Focus editor so selection/bookmark operations work reliably
    } catch (err) {
      this.AddError("Could not focus the editor");
      console.error("Could not focus the editor", err);
    }
    // If a bookmark exists (edit flow), restore it now so insertion happens at original spot
    if (this.FormulaBookmark) {
      try {
        tinyMceEditor.selection.moveToBookmark(this.FormulaBookmark); // move to formula bookmark
      } catch (err) {
        this.AddError("Failed to restore saved editor bookmark; will attempt best-effort insertion");
        console.error(err);
      } finally {
        // clear the stored bookmark regardless of success to avoid reuse
        this.FormulaBookmark = undefined;
      }
    } else {
      // When no bookmark, ensure we don't accidentally insert *inside* an existing formula
      const selNode = tinyMceEditor.selection.getNode();
      const enclosingFormula = tinyMceEditor.dom.getParent(selNode, "div.formula");
      if (enclosingFormula) {
        tinyMceEditor.selection.select(enclosingFormula);
        tinyMceEditor.selection.collapse(false); // move caret after the formula element
      } // If nothing special, leave selection as-is
    }
    tinyMceEditor.selection.setContent(content); // replace the selected formula
    // ensure editor knows about DOM changes and has an undo snapshot
    tinyMceEditor.nodeChanged();
    tinyMceEditor.setDirty(true);
    tinyMceEditor.undoManager.add();
    this.IsMathDialogOpen = false; // Close the math dialog after successful insertion
  };

  public async SaveEditorContent() {
    await this.SaveContent();
    if (this.TinyMceInitialContentRef) this.TinyMceInitialContentRef.current = this.CurrentHtml ?? "";
    this.IsDirty = false;
  }

  public async SaveContent() {
    if (!this.SelectedNode) throw new Error("No selected node");
    const editor = this.TinyMceEditorRef?.current;
    if (!editor) {
      this.AddError("Unable to reference editor.");
      return;
    }
    editor.setProgressState(true);
    this.isContentSaving = true;
    // add headers and basePath script
    try {
      const editableDivContentRaw = editor.getContent() || `<p>[Empty Chapter]</p>`;
      // sanitize user content: remove exact wrapper or escape partial matches
      const editableDivContent = this.SanitizeEditorHtml(editableDivContentRaw);
      // Ensure the content exist
      if (!editableDivContent) return;
      // Construct content with wrapper
      let content: string = [
        `<article>`,
        `    <div class="syllabus">${this.SelectedNode.referenceID?.slice(0, -3) ?? ""}</div>`,
        `    <div id="${this.SelectedNode.id}" class="extsyllabus"></div>`,
        `    <div id="editable_${this.SelectedNode.id}">`,
        `        ${editableDivContent}`,
        `    </div>`,
        `</article>`,
      ]
        .map((line) => line.trim())
        .join("");
      content = this.EnsureScript(content, this.SelectedNode);
      const fileName: string = `content.html`;
      if (this.SelectedNode.parent?.path) this.UpdateNodePath(this.SelectedNode, this.SelectedNode.parent?.path, false);
      // Save content to the Dataverse
      const res = await this.cdsService.setContentFile(this.SelectedNode, content, fileName);
      if (res.error) this.AddError(res.error.message);
      else if (this.SelectedChapter?.id) delete this.chapterFiles[this.SelectedChapter.id];
    } catch (error: any) {
      this.AddError(error.message);
    }
    editor.setProgressState(false);
    this.isContentSaving = false;
  }

  public EnsureScript(htmlContent: string, to: Content): string {
    const $ = load(htmlContent);
    // Ensure the script is added only once to the article of the tree level 1 node
    if (to.treeLevel === 1 && !$("script#pathBase").length) {
      const script = `<script data-path-base="../../js" id="pathBase" src="../../js/main.js"></script>`;
      $("article").append(script);
    }
    // return the body content only, without the body tag
    return $("body").html() || "";
  }

  /**
   * Sanitize editor HTML:
   * - If the full exact wrapper structure is present (article > div.syllabus + div.extsyllabus + div#editable_<id>),
   *   return the inner HTML of the editable_* div (strip the wrappers completely).
   * - Otherwise, for any partial matches (elements with class .syllabus, .extsyllabus, or id starting with editable_),
   *   replace the entire element with an escaped text node of its outerHTML.
   */
  public SanitizeEditorHtml(rawHtml: string): string | undefined {
    // helper: decode common HTML entities (works in both browser/node contexts)
    const decodeEntities = (s: string) =>
      s
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    try {
      // If the input looks like escaped (by the editor) HTML wrappers, decode them first.
      // Example trigger: "&lt;article" or "&lt;div class=\"syllabus\""
      const looksEscapedWrapper =
        /&lt;\s*article\b/i.test(rawHtml) || /&lt;\s*div\b[^>]*class\s*=\s*["']syllabus["']/i.test(rawHtml);
      const normalizedHtml = looksEscapedWrapper ? decodeEntities(rawHtml) : rawHtml;
      const $ = load(normalizedHtml, { decodeEntities: false });
      // Collect placeholders for all exact wrapper matches.
      const placeholders: Record<string, string> = {};
      let placeholderIndex = 0;
      $("article").each((_index, articleElement) => {
        const $article = $(articleElement);
        const syllabus = $article.children("div.syllabus").first();
        const extsyllabus = $article.children("div.extsyllabus").first();
        const editable = $article
          .children("div")
          .filter((_, el) => {
            const id = $(el).attr("id") || "";
            return id.startsWith("editable_");
          })
          .first();
        if (syllabus.length && extsyllabus.length && editable.length) {
          const inner = editable.html() ?? "";
          const token = `__WRAPPER_PLACEHOLDER_${placeholderIndex++}__`;
          placeholders[token] = inner;
          $article.replaceWith(token);
        }
      });
      // Escape partial matches anywhere (won't touch preserved placeholders).
      const partialSelector = 'div.syllabus, div.extsyllabus, [id^="editable_"]';
      $(partialSelector).each((_index, element) => {
        const outer = $.html(element) ?? "";
        // replace the element with a text node containing the escaped outerHTML
        $(element).replaceWith(this.EscapeHtmlForEditor(outer));
      });
      // Serialize and restore placeholders with original inner HTML (unescaped).
      // Prefer only body content (prevents <html><head>... wrapper).
      const serialized = $("body").length ? $("body").html() ?? "" : $.root().html() ?? "";
      let result = serialized;
      for (const token in placeholders) result = result.split(token).join(placeholders[token]);
      return result;
    } catch (err) {
      this.AddError(`Sanitize Editor HTML: parse error: ${err}`);
    }
  }

  public EscapeHtmlForEditor(input: string) {
    return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  private async createContentNodeFile(node: Content): Promise<boolean> {
    // add headers and basePath script
    try {
      let content: string = [
        `<article>`,
        `    <div class="syllabus">${node.referenceID?.slice(0, -3) ?? ""}</div>`,
        `    <div id="${node.id}" class="extsyllabus"></div>`,
        `    <div id="editable_${node.id}">`,
        `        <p>[Empty Chapter]</p>`,
        `    </div>`,
        `</article>`,
      ]
        .map((line) => line.trim())
        .join("");
      content = this.EnsureScript(content, node);
      const fileName: string = `content.html`;
      // Save content to the Dataverse
      const res = await this.cdsService.setContentFile(node, content, fileName);
      if (res.error) throw new Error(res.error.message);
      return true; // File created successfully
    } catch (error: any) {
      this.AddError(`Error creating content file: ${error.message}`);
      return false; // File creation failed
    }
  }

  private async updateContentNodeFile(updated: Content, oldRefId: string): Promise<boolean> {
    // Update the reference IDs in the node's file
    try {
      await this.fetchCurrentNodeContent(true); // the entire file
      if (!this.SelectedNode?.htmlContent) throw new Error("Couldn't get the HTML content of the selected node.");
      // Get the HTML of the selected node
      let content = this.SelectedNode.htmlContent;
      const $ = load(content);
      // Find the div with class "syllabus" and specific content
      const syllabusDiv = $(`div.syllabus:contains("${oldRefId.slice(0, -3)}")`);
      // Update the content of the syllabus div
      if (syllabusDiv.length) syllabusDiv.text(updated.referenceID?.slice(0, -3) ?? "");
      // Get the updated HTML
      content = $.html();
      // Ensure Script
      content = this.EnsureScript(content, updated);
      // Update the HTML in the selected node
      this.SelectedNode.htmlContent = content;
      // Set the updated file name
      const fileName: string = `content.html`;
      // Save the updated content to the Dataverse
      const res = await this.cdsService.setContentFile(updated, this.SelectedNode.htmlContent, fileName);
      if (res.error) throw new Error(res.error.message);
      return true; // File updated successfully
    } catch (error: any) {
      this.AddError(`Error Updating Content File: ${error.message}`);
      return false; // File update failed
    }
  }

  // TODO: either remove or update to support infinite tree levels
  /**
   * Creates a reference‑ID in the form  XXX CC LL TT 00
   *   @param firstThree first 3 digits of the subject code (e.g. "031")
   *   @param formType type of node we're about to create
   *   @param beforeNode either the would‑be parent (type = formType‑1)
   *   or the sibling that will sit directly **before** the new node
   *   @throw error when the parent node is not found.
   */
  public GenerateReferenceId(): string | null {
    if (!this.SubjectCodeFirstThree) {
      this.AddError(`The "Subject Code" is undefined`);
      return null;
    }
    if (!this.FormTreeLevel) {
      this.AddError(`The "Form Type" is undefined`);
      return null;
    }
    if (!this.ContentNodeBefore) {
      this.AddError(`The "Content Node Before" is undefined`);
      return null;
    }
    /* ---------------------------------------------------------- */
    /* 0. Helpers                                                 */
    /* ---------------------------------------------------------- */
    const PAD = (n: number) => n.toString().padStart(2, "0");
    /** ordinal position (1‑based) of `node` among its siblings[] */
    const getOrdinalPosition = (nodeId: string): number => this.FindNodeAndSiblings(nodeId).index + 1; // always >= 1
    /* ------------------------------------------------------------------ */
    /* 1. Decide the real parent, sibling list, and 0‑based insert index  */
    /* ------------------------------------------------------------------ */
    const isParent = this.ContentNodeBefore.treeLevel === this.FormTreeLevel - 1;
    let parent: Content | null = null; // logical parent of the new node
    /* beforeNode is the *parent* (e.g. adding Lesson under Chapter) */
    if (isParent) parent = this.ContentNodeBefore;
    else {
      /* beforeNode is an existing *sibling* in the same list */
      parent = this.FindNodeAndSiblings(this.ContentNodeBefore.id).parent;
      if (!parent) {
        this.AddError("Parent not found");
        return null; // Return null on error
      }
    }
    const siblings: Content[] = parent.children ?? []; // parent's current children
    const insertIndex = isParent // 0‑based index where new node will go
      ? siblings.length // append to end
      : siblings.indexOf(this.ContentNodeBefore) + 1; // slot after the sibling
    /* ------------------------------------------------------------------ */
    /* 2. Build the CC / LL / TT segments                                 */
    /* ------------------------------------------------------------------ */
    let cc = "00";
    let ll = "00";
    let tt = "00";
    switch (this.FormTreeLevel) {
      /* ---------- creating a CHAPTER ---------- */
      case 1: {
        cc = PAD(insertIndex + 1); // position inside subject
        break;
      }
      /* ---------- creating a LESSON ----------- */
      case 2: {
        cc = PAD(getOrdinalPosition(parent.id)); // parent IS the chapter
        ll = PAD(insertIndex + 1); // position inside chapter
        break;
      }
      /* ---------- creating a TOPIC ------------ */
      case 3: {
        const lesson = parent; // parent is the Lesson
        /* lesson ordinal within its chapter */
        ll = PAD(getOrdinalPosition(lesson.id));
        /* chapter ordinal within the subject */
        const chapter = lesson.parent;
        if (!chapter) throw new Error("Lesson does not have a chapter parent.");
        cc = PAD(getOrdinalPosition(chapter.id));
        /* topic ordinal within its lesson */
        tt = PAD(insertIndex + 1); // position inside lesson
        break;
      }
    }
    /* ---------------------------------------------------------- */
    /* 3. Return the final ID                                     */
    /* ---------------------------------------------------------- */
    return `${this.SubjectCodeFirstThree} ${cc} ${ll} ${tt} 00`;
  }

  /**
   * Checks if the given referenceId is unique in the current content tree.
   * @param referenceId The reference ID to check for uniqueness.
   * @returns true if the reference ID is unique, false otherwise.
   */
  public IsReferenceIdUnique(referenceId: string): boolean {
    // Create a stack and initialize it with all root nodes
    const stack = [...this.Records];
    while (stack.length > 0) {
      // Pop the last node from the stack
      const node = stack.pop()!;
      // Check if current node's referenceID matches the given ID
      if (node.referenceID === referenceId) return false; // Duplicate found → not unique
      // Add all children of this node to the stack
      if (node.children && node.children.length > 0) stack.push(...node.children);
    }
    return true; // No duplicates found → unique
  }
}
