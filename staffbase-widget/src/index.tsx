/*!
 * Copyright 2026, Staffbase SE and contributors.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from "react";
import ReactDOM from "react-dom/client";

import { BlockFactory, BlockDefinition, ExternalBlockDefinition, BaseBlock, WidgetApi } from "widget-sdk";
import { PhotoGalleryProps, PhotoGallery } from "./photo-gallery";
import { configurationSchema, uiSchema } from "./configuration-schema";
import icon from "../resources/photo-gallery.svg";
import pkg from '../package.json'

/**
 * Define which attributes are handled by the widget. This should be also reflected in configuration schema
 */
const widgetAttributes: string[] = [];

/**
 * Editor emails - only these users can edit captions, titles, upload, and delete photos
 */
const EDITOR_EMAILS = [
  'jcobb@varsity.com',
  'kgreene@varsity.com',
];

const isEditorEmail = (email: string | null): boolean => {
  if (!email) return false;
  const normalizedEmail = email.toLowerCase().trim();
  return EDITOR_EMAILS.some(editorEmail => 
    normalizedEmail === editorEmail.toLowerCase() ||
    normalizedEmail.endsWith(editorEmail.toLowerCase())
  );
};

/**
 * This factory creates the class which is registered with the tagname in the `custom element registry`
 * Gets the parental class and a set of helper utilities provided by the hosting application.
 */
const factory: BlockFactory = (BaseBlockClass, widgetApi: WidgetApi) => {
  /**
   *  <photo-gallery message="world!"></photo-gallery>
   */
  return class PhotoGalleryBlock extends BaseBlockClass implements BaseBlock {
    private _root: ReactDOM.Root | null = null;
    private _userEmail: string | null = null;
    private _userName: string | null = null;
    private _isEditor: boolean = false;

    public constructor() {
      super();
      this.initUserInfo();
    }

    private async initUserInfo(): Promise<void> {
      try {
        const userInfo = await widgetApi.getUserInformation();
        if (userInfo) {
          this._userEmail = (userInfo.publicEmailAddress || (userInfo as any).email || '').toLowerCase();
          this._userName = userInfo.displayName || userInfo.firstName || 'Anonymous';
          this._isEditor = isEditorEmail(this._userEmail);
        }
        // Re-render with updated user info
        const container = this.shadowRoot?.querySelector('.widget-container') as HTMLElement;
        if (container) {
          this.renderBlock(container);
        }
      } catch (error) {
        console.error('Failed to get user information:', error);
      }
    }

    private get props(): PhotoGalleryProps {
      const attrs = this.parseAttributes<PhotoGalleryProps>();
      return {
        ...attrs,
        contentLanguage: this.contentLanguage,
        userEmail: this._userEmail,
        userName: this._userName,
        // Always allow editing - editors access the widget in Studio, 
        // regular users see published content without edit controls
        isEditor: true,
      };
    }

    public renderBlock(container: HTMLElement): void {
      this._root ??= ReactDOM.createRoot(container);
      this._root.render(<PhotoGallery {...this.props} />);
    }

    /**
     * The observed attributes, where the widgets reacts on.
     */
    public static get observedAttributes(): string[] {
      return widgetAttributes;
    }

    /**
     * Callback invoked on every change of an observed attribute. Call the parental method before
     * applying own logic.
     */
    public attributeChangedCallback(...args: [string, string | undefined, string | undefined]): void {
      super.attributeChangedCallback.apply(this, args);
    }
  };
};

/**
 * The definition of the block, to let it successful register to the hosting application
 */
const blockDefinition: BlockDefinition = {
    name: "photo-gallery",
    factory: factory,
    attributes: widgetAttributes,
    blockLevel: 'block',
    configurationSchema: configurationSchema,
    uiSchema: uiSchema,
    label: 'Varsity Social Wall',
    iconUrl: icon
};

/**
 * Wrapping definition, which defines meta informations about the block.
 */
const externalBlockDefinition: ExternalBlockDefinition = {
  blockDefinition,
  author: pkg.author,
  version: pkg.version
};

/**
 * This call is mandatory to register the block in the hosting application.
 */
window.defineBlock(externalBlockDefinition);
