export interface ToolParams {
  action: string;
  [key: string]: unknown;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ParamSchema {
  key: string;
  label: string;
  type: 'text' | 'select' | 'checkbox' | 'file' | 'password';
  options?: string[];
  defaultValue?: string | boolean;
  required?: boolean;
  placeholder?: string;
  description?: string;
  isPath?: boolean;
  pathType?: 'file' | 'directory' | 'any';
}

export abstract class BaseTool {
  abstract readonly name: string;
  abstract getActions(): string[];
  abstract buildCommand(params: ToolParams): string[];
  abstract validate(params: ToolParams): ValidationError[];
  abstract getParamSchema(action: string): ParamSchema[];
}
