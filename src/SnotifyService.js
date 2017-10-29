/* eslint-disable */
import Vue from 'vue'
import SnotifyPosition from './enums/SnotifyPosition'
import SnotifyAction from './enums/SnotifyAction'
import SnotifyType from './enums/SnotifyType'
import {generateAnimationDefaults, uuid, mergeDeep} from './util'
import {SnotifyToast} from './SnotifyToast.model'

import { ToastDefaults } from './toastDefaults';

const animationDefaults = generateAnimationDefaults(400);

class SnotifyService {
  constructor() {
    this.emitter = new Vue();
    this.notifications = [];
    this.config = ToastDefaults;
  }
    /**
     * emit changes in notifications array
     */
    emit () {
      this.emitter.$emit('notificationsChanged', this.notifications.slice())
    }
    /**
     * returns SnotifyToast object
     * @param id {Number}
     * @return {undefined|SnotifyToast}
     */
    get (id) {
      return this.notifications.find(toast => toast.id === id)
    }

    /**
     * add SnotifyToast to notifications array
     * @param toast {SnotifyToast}
     */
    add (toast) {
      if (this.config.global.newOnTop) {
        this.notifications.unshift(toast);
      } else {
        this.notifications.push(toast);
      }
      this.emit();
    }

    /**
     * If ID passed, emits toast animation remove, if ID & REMOVE passed, removes toast from notifications array
     * @param [id] {number}
     * @param [remove] {boolean}
     */
    remove (id, remove) {
      if (!id) {
        return this.clear();
      } else if (remove) {
        this.notifications = this.notifications.filter(toast => toast.id !== id);
        return this.emit();
      }
      this.emitter.$emit('remove', id);
    }
    /**
     * Clear notifications array
     */
    clear () {
      this.notifications = [];
      this.emit()
    }

    /**
     * Creates toast and add it to array, returns toast id
     * @param {{title, body, config}} snotify
     * @return {number}
     */
    create (snotify) {
      const config =
        mergeDeep(this.config.toast, this.config.type[snotify.config.type], snotify.config);
      const toast = new SnotifyToast(
        uuid(),
        snotify.title,
        snotify.body,
        config
      );
      this.add(toast);
      return toast;
    }


    /**
     * Set global config
     * @param defaults {SnotifyDefaults}
     * @returns options {Object<SnotifyDefaults>}
     */
    setDefaults(defaults) {
      return this.config = mergeDeep(this.config, defaults);
    }



    /**
     * Create toast with Success style, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    success (body, title, config) {
      return this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config, {type: SnotifyType.SUCCESS}, config)
      })
    }
    /**
     * Create toast with Error style, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    error (body, title, config) {
      return this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config, {type: SnotifyType.ERROR}, config)
      })
    }

    /**
     * Create toast with Info style, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    info (body, title, config) {
      return this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config, {type: SnotifyType.INFO}, config)
      })
    }

    /**
     * Create toast with Warining style, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    warning (body, title, config) {
      return this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config, {type: SnotifyType.WARNING}, config)
      })
    }

    /**
     * Create toast without style, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    simple (body, title, config) {
      return this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config, {type: SnotifyType.SIMPLE}, config)
      })
    }

    /**
     * Create toast with Confirm style {with two buttons}, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    confirm (body, title, config) {
      const id = this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config,
          {
            buttons: [
              {text: 'Ok', action: null, bold: true},
              {text: 'Cancel', action: () => this.remove(id), bold: false}
            ]
          },
          config,
          {
            type: SnotifyType.CONFIRM,
            closeOnClick: false
          }
        )
      });
      return id
    }

    /**
     * Create toast with Prompt style {with two buttons}, returns toast id;
     * @param body {string}
     * @param [title] {string}
     * @param [config] {SnotifyConfig}
     * @return {number}
     */
    prompt (body, title, config) {
      const id = this.create({
        title: title,
        body: body,
        config: mergeDeep(this.config,
          {
            buttons: [
              {text: 'Ok', action: null, bold: true},
              {text: 'Cancel', action: () => this.remove(id), bold: false}
            ],
            placeholder: 'Enter answer here...'
          }, config,
          {
            timeout: 0,
            closeOnClick: false,
            type: SnotifyType.PROMPT
          }
        )
      });
      return id
    }

    /**
     * Creates empty toast with html string inside
     * @param html {string}
     * @param [config] {SnotifyConfig}
     * @returns {number}
     */
    html (html, config) {
      return this.create({
        title: null,
        body: null,
        config: mergeDeep(this.config, {type: SnotifyType.SIMPLE, html}, config)
      })
    }

    /**
     * Creates async toast with Info style. Pass action, and resolve or reject it.
     * @param body {String}
     * @param title {String}
     * @param action {Promise<SnotifyConfig>}
     * @return {number}
     */
    async (body, title, action) {
      const id = this.simple(body, title, {
        pauseOnHover: false,
        closeOnClick: false,
        timeout: 0,
        showProgressBar: false,
        type: SnotifyType.ASYNC
      });

      let toast = this.get(id);
      let latestToast = Object.assign({}, toast);

      const updateToast = (type, data) => {
        if (!data) {
          latestToast = mergeDeep(toast, latestToast, {config: {type: type}})
        } else {
          latestToast = mergeDeep(toast, data, {config: {type: type}})
        }
        this.$emit('toastChanged', latestToast)
      };
      this.$on(SnotifyAction.mounted, (passedToast) => {
        if (passedToast.id === id && action) {
          action().then((data) => {
            updateToast(SnotifyType.SUCCESS, data)
          }).catch((data) => {
            updateToast(SnotifyType.ERROR, data)
          })
        }
      });

      return id
    }

}

export default new SnotifyService();
