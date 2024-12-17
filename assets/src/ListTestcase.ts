import { _decorator, Component, Node, EditBox, misc, Button, Sprite, Color } from "cc";
import { TestVList } from "./TestVList";
const { ccclass, property } = _decorator;

type Mode = "n" | "h" | "v" | "g";

const COLOR = {
    ON: new Color(255, 255, 255),
    OFF: new Color(160, 160, 160),
} as const;

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
    $glist: TestVList = null;

    @property(EditBox)
    $editbox: EditBox = null;

    @property(Node)
    $hbtn: Node = null;

    @property(Node)
    $vbtn: Node = null;

    @property(Node)
    $gbtn: Node = null;

    private _mode: Mode = "n";

    protected start(): void {
        (<any>window).canvas = this;
        this.changeMode("g");
    }

    protected onEnable(): void {
        this.$editbox.node.on(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$hbtn.on(Button.EventType.CLICK, this.onChangeModeH, this);
        this.$vbtn.on(Button.EventType.CLICK, this.onChangeModeV, this);
        this.$gbtn.on(Button.EventType.CLICK, this.onChangeModeG, this);
    }

    protected onDisable(): void {
        this.$editbox.node.off(EditBox.EventType.EDITING_RETURN, this.onSendMsg, this);
        this.$hbtn.off(Button.EventType.CLICK, this.onChangeModeH, this);
        this.$vbtn.off(Button.EventType.CLICK, this.onChangeModeV, this);
        this.$gbtn.off(Button.EventType.CLICK, this.onChangeModeG, this);
    }

    private get isModeH() {
        return this._mode == "h";
    }

    private get isModeV() {
        return this._mode == "v";
    }

    private get isModeG() {
        return this._mode == "g";
    }

    private changeMode(mode: Mode) {
        if (this._mode == mode) return;
        this._mode = mode;
        this.$hlist.node.active = mode == "h";
        this.$vlist.node.active = mode == "v";
        this.$glist.node.active = mode == "g";
        this.$editbox.node.active = mode == "h" || mode == "v";
        this.$hbtn.getComponent(Sprite).color = mode == "h" ? COLOR.ON : COLOR.OFF;
        this.$vbtn.getComponent(Sprite).color = mode == "v" ? COLOR.ON : COLOR.OFF;
        this.$gbtn.getComponent(Sprite).color = mode == "g" ? COLOR.ON : COLOR.OFF;
    }

    private onChangeModeH() {
        this.changeMode("h");
    }

    private onChangeModeV() {
        this.changeMode("v");
    }

    private onChangeModeG() {
        this.changeMode("g");
    }

    private onSendMsg() {
        const text = this.$editbox.string;
        if (text.length > 0) {
            if (this.isModeH) {
                this.$hlist.insertEnd(text);
            } else if (this.isModeV) {
                this.$vlist.insertEnd(text);
            }
        }
        this.$editbox.string = "";
        misc.callInNextTick(() => {
            this.$editbox.setFocus();
        });
    }
}
