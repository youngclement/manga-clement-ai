// Canvas Editor Types

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  position: Position;
  size: Size;
  rotation: number;
  zIndex: number;
}

export type ElementType = 'panel' | 'image' | 'text' | 'dialogue';

export interface BaseElement {
  id: string;
  type: ElementType;
  transform: Transform;
  locked: boolean;
  visible: boolean;
  name: string;
}

export interface PanelElement extends BaseElement {
  type: 'panel';
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  children: string[]; // IDs of child elements
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  objectFit: 'cover' | 'contain' | 'fill';
  opacity: number;
  parentId?: string; // ID of parent panel
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  lineHeight: number;
  parentId?: string;
}

export interface DialogueElement extends BaseElement {
  type: 'dialogue';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  color: string;
  textAlign: 'left' | 'center' | 'right';
  backgroundColor: string;
  borderColor: string;
  strokeSize: number;
  bubbleStyle: 'rounded' | 'box' | 'cloud' | 'thought';
  hasTail: boolean;
  tailAngle: number;
  tailLength: number;
  parentId?: string;
}

export type CanvasElement = PanelElement | ImageElement | TextElement | DialogueElement;

export interface CanvasPage {
  id: string;
  name: string;
  elements: CanvasElement[];
  backgroundColor: string;
  width: number;
  height: number;
}

export interface CanvasProject {
  id: string;
  name: string;
  pages: CanvasPage[];
  currentPageIndex: number;
  createdAt: number;
  updatedAt: number;
}

export interface CanvasState {
  project: CanvasProject;
  selectedElementIds: string[];
  zoom: number;
  panOffset: Position;
  tool: 'select' | 'pan' | 'panel' | 'text' | 'dialogue';
  clipboard: CanvasElement[];
  history: CanvasProject[];
  historyIndex: number;
}
