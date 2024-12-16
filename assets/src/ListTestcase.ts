import { _decorator, Component, Node, EditBox, Label, Layout, UITransform, director } from "cc";
import { TestVList } from "./TestVList";
const { ccclass, property } = _decorator;

@ccclass("ListTestcase")
export class ListTestcase extends Component {
    @property(TestVList)
    $list: TestVList = null;

    @property(EditBox)
    $editbox: EditBox = null;

    @property(Node)
    $vitem: Node = null;

    private _dirty: boolean = false;

    protected onLoad(): void {
        (<any>window).cases = this;
        this.$vitem.active = true;
        this.$vitem.setPosition(-10000, -10000);
    }

    public getItemHeight(text: string) {
        const label = this.$vitem.getComponentInChildren(Label);
        label.string = text;
        label.updateRenderData(true);
        this.$vitem.getComponent(Layout).updateLayout(true);
        director.root.frameMove(0);
        return this.$vitem.getComponent(UITransform).height;
    }

    protected onEnable(): void {
        this.$editbox.node.on("editing-did-ended", this.onEditboxEnd, this);
    }

    protected onDisable(): void {
        this.$editbox.node.off("editing-did-ended", this.onEditboxEnd, this);
    }

    private onEditboxEnd() {
        let text = this.$editbox.string;
        this.send(text);
        this.$editbox.string = "";
        this.$editbox.setFocus();
    }

    public send(text: string) {
        if (text) {
            this.$list.insertEnd(text);
            this._dirty = true;
        }
    }

    protected lateUpdate(dt: number): void {
        // if (this._dirty) {
        //     const atEnd = this.$list.atEnd();
        //     const animating = this.$list.animating;
        //     if (!animating && !atEnd) {
        //         if (atEnd) {
        //             this._dirty = false;
        //         } else {
        //             this.$list.scrollToEnd(0.1);
        //         }
        //     }
        // }
    }
}
