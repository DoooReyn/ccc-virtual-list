import ReusableNodePool from "./ReusableNodePool";
import { VList } from "./VList";
import { _decorator, Label, Layout, misc, Node, Tween, tween, UIOpacity, UITransform } from "cc";
const { ccclass } = _decorator;

@ccclass("TestVList")
export class TestVList extends VList {
    private _vpool: ReusableNodePool;

    protected onLoad(): void {
        super.onLoad();
        this._vpool = new ReusableNodePool();
    }

    protected start(): void {
        this._vpool.add(this.node.parent.getChildByName("HItem"));
        this._vpool.add(this.node.parent.getChildByName("VItem"));
        this.data = [];
        (<any>window).vlist = this;
    }

    protected onDestroy(): void {
        this._vpool.clear();
        super.onDestroy();
    }

    protected appendItem(index: number) {
        return this._vpool.acquire(this.horizontal ? "HItem" : "VItem");
    }

    protected renderItem(item: Node, index: number) {
        const text = this._dataSource[index];
        item.getChildByName("Label").getComponent(Label).string = text;
        misc.callInNextTick(() => {
            // 需要将新的尺寸更新到虚拟子项中
            item.getComponent(Layout).updateLayout(true);
            this.onItemSizeChanged(index);
        });
    }

    protected onItemSizeChanged(index: number) {
        const item = this.getItemAt(index);
        if (item) {
            const height = item.getComponent(UITransform).height;
            this.updateItemHeight(index, height);
        }
    }

    protected recycleItem(item: Node): void {
        this._vpool.recycle(item);
        item.targetOff(this);
        item.getChildByName("Label").getComponent(Label).string = "";
        item.getComponent(UITransform).setContentSize(640, 52);
        item.active = false;
    }

    protected getItemSize(index: number): [number, number] {
        return [640, 52];
    }
}
