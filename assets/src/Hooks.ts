import Hook from "./Hook";

export default class Hooks {
    private _hooks: Hook[];
    constructor() {
        this._hooks = [];
    }

    set(hook: Function, thisArg: any) {
        this._hooks.push(new Hook(hook, thisArg));
    }

    delete(hook: Function, thisArg: any) {
        for (let i = this._hooks.length - 1; i >= 0; i--) {
            if (this._hooks[i].equals(hook, thisArg)) {
                this._hooks.splice(i, 1);
            }
        }
    }

    clear() {
        this._hooks.length = 0;
    }

    run() {
        for (let i = 0; i < this._hooks.length; i++) {
            this._hooks[i].run();
        }
    }

    runWith(...args: any[]) {
        for (let i = 0; i < this._hooks.length; i++) {
            this._hooks[i].runWith(...args);
        }
    }
}
