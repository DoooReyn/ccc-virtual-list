import { _decorator, Component, Node, EditBox, misc, Button, Sprite, Color, resources, Prefab } from "cc";
import { TestVList } from "./TestVList";
import Hooks from "./Hooks";
import ReusableNodePool from "./ReusableNodePool";
const { ccclass, property } = _decorator;

type Mode = "n" | "sh" | "sv" | "gh" | "gv";

const COLOR = {
    ON: new Color(255, 255, 255),
    OFF: new Color(160, 160, 160),
} as const;

class QueueLoader {
    private _hooks: Hooks;
    constructor(private _count: number = 0) {
        this._hooks = new Hooks();
    }
    dec() {
        this._count--;
        if (this._count <= 0) {
            this._count = 0;
            this._hooks.run();
        }
    }
    onComplete(hook: Function, thisArg: any) {
        this._hooks.clear();
        this._hooks.set(hook, thisArg, true);
    }
    offComplete() {
        this._hooks.clear();
    }
}

export class ListTestItemPool extends ReusableNodePool {
    private static _inst: ListTestItemPool;
    static get inst() {
        if (!this._inst) {
            this._inst = new ListTestItemPool();
        }
        return this._inst;
    }
}

/**
 * 虚拟列表测试示例
 * - 聊天列表
 */
@ccclass("ListTestcase")
export class ListTestcase extends Component {
    @property(TestVList)
    $hlist: TestVList = null;

    @property(TestVList)
    $vlist: TestVList = null;

    @property(TestVList)
    $ghlist: TestVList = null;

    @property(TestVList)
    $gvlist: TestVList = null;

    @property(EditBox)
    $editbox: EditBox = null;

    @property(Node)
    $shbtn: Node = null;

    @property(Node)
    $svbtn: Node = null;

    @property(Node)
    $ghbtn: Node = null;

    @property(Node)
    $gvbtn: Node = null;

    @property(Node)
    $gabtn: Node = null;

    @property(Node)
    $grbtn: Node = null;

    @property(Node)
    $startbtn: Node = null;

    @property(Node)
    $endbtn: Node = null;

    private _mode: Mode = "n";

    protected start(): void {
        (<any>window).canvas = this;
        const queueLoader = new QueueLoader(3);
        queueLoader.onComplete(this.onLoadComplete, this);
        const oncomplete = (err: Error, res: Prefab) => {
            if (res) ListTestItemPool.inst.add(res);
            queueLoader.dec();
        };
        resources.load("HItem", Prefab, oncomplete);
        resources.load("VItem", Prefab, oncomplete);
        resources.load("GItem", Prefab, oncomplete);
    }

    private onLoadComplete() {
        this.changeMode("sh");
    }

    protected onEnable(): void {
        this.$editbox.node.on(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$shbtn.on(Button.EventType.CLICK, this.onChangeModeSH, this);
        this.$svbtn.on(Button.EventType.CLICK, this.onChangeModeSV, this);
        this.$ghbtn.on(Button.EventType.CLICK, this.onChangeModeGH, this);
        this.$gvbtn.on(Button.EventType.CLICK, this.onChangeModeGV, this);
        this.$gabtn.on(Button.EventType.CLICK, this.onAddItem, this);
        this.$grbtn.on(Button.EventType.CLICK, this.onRemoveItem, this);
        this.$startbtn.on(Button.EventType.CLICK, this.onScrollToStart, this);
        this.$endbtn.on(Button.EventType.CLICK, this.onSrollToEnd, this);
    }

    protected onDisable(): void {
        this.$editbox.node.off(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$shbtn.off(Button.EventType.CLICK, this.onChangeModeSH, this);
        this.$svbtn.off(Button.EventType.CLICK, this.onChangeModeSV, this);
        this.$ghbtn.off(Button.EventType.CLICK, this.onChangeModeGH, this);
        this.$gvbtn.off(Button.EventType.CLICK, this.onChangeModeGV, this);
        this.$gabtn.off(Button.EventType.CLICK, this.onAddItem, this);
        this.$grbtn.off(Button.EventType.CLICK, this.onRemoveItem, this);
        this.$startbtn.off(Button.EventType.CLICK, this.onScrollToStart, this);
        this.$endbtn.off(Button.EventType.CLICK, this.onSrollToEnd, this);
    }

    private get isModeSH() {
        return this._mode == "sh";
    }

    private get isModeSV() {
        return this._mode == "sv";
    }

    private get isModeGH() {
        return this._mode == "gh";
    }

    private get isModeGV() {
        return this._mode == "gv";
    }

    private changeMode(mode: Mode) {
        if (this._mode == mode) return;
        this._mode = mode;
        this.$hlist.node.active = this.isModeSH;
        this.$vlist.node.active = this.isModeSV;
        this.$ghlist.node.active = this.isModeGH;
        this.$gvlist.node.active = this.isModeGV;
        this.$editbox.node.active = this.isModeSH || this.isModeSV;
        this.$gabtn.active = this.isModeGH || this.isModeGV;
        this.$grbtn.active = this.isModeGH || this.isModeGV;
        this.$shbtn.getComponent(Sprite).color = this.isModeSH ? COLOR.ON : COLOR.OFF;
        this.$svbtn.getComponent(Sprite).color = this.isModeSV ? COLOR.ON : COLOR.OFF;
        this.$ghbtn.getComponent(Sprite).color = this.isModeGH ? COLOR.ON : COLOR.OFF;
        this.$gvbtn.getComponent(Sprite).color = this.isModeGV ? COLOR.ON : COLOR.OFF;
    }

    private onAddItem() {
        const count = (Math.random() * 10 + 1) | 0;
        const list = this.isModeGH ? this.$ghlist : this.$gvlist;
        for (let i = 0, index: number, text: string; i < count; i++) {
            const index = (Math.random() * list.count) | 0;
            text = ((Math.random() * 100) | 0).toString();
            list.insertAt(index, text);
        }
    }

    private onRemoveItem() {
        const list = this.isModeGH ? this.$ghlist : this.$gvlist;
        if (list.count > 0) {
            const index = (Math.random() * list.count) | 0;
            list.removeAt(index);
        }
    }

    private onChangeModeSH() {
        this.changeMode("sh");
    }

    private onChangeModeSV() {
        this.changeMode("sv");
    }

    private onChangeModeGH() {
        this.changeMode("gh");
    }

    private onChangeModeGV() {
        this.changeMode("gv");
    }

    private onScrollToStart() {
        if (this.isModeSH) {
            this.$hlist.scrollToStart(0.5);
        } else if (this.isModeSV) {
            this.$vlist.scrollToStart(0.5);
        } else if (this.isModeGH) {
            this.$ghlist.scrollToStart(0.5);
        } else if (this.isModeGV) {
            this.$gvlist.scrollToStart(0.5);
        }
    }

    private onSrollToEnd() {
        if (this.isModeSH) {
            this.$hlist.scrollToEnd(0.5);
        } else if (this.isModeSV) {
            this.$vlist.scrollToEnd(0.5);
        } else if (this.isModeGH) {
            this.$ghlist.scrollToEnd(0.5);
        } else if (this.isModeGV) {
            this.$gvlist.scrollToEnd(0.5);
        }
    }

    private onSendMsg() {
        const text = this.$editbox.string;
        if (text.length > 0) {
            if (this.isModeSH) {
                this.$hlist.insertEnd(text);
            } else if (this.isModeSV) {
                this.$vlist.insertEnd(text);
            }
        }
        this.$editbox.string = "";
        misc.callInNextTick(() => {
            this.$editbox.setFocus();
        });
    }
}
