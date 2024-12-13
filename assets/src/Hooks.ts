import Hook from "./Hook";

export class Hooks {
    private _hooks: Hook[];
    constructor() {
        this._hooks = [];
    }
    
    set(hook: Function, thisArg: any) {
        this._hooks.push(new Hook(hook, thisArg));
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
