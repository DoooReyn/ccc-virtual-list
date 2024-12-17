import ReusableNodePool from "./ReusableNodePool";
import { VirtualList } from "./VirtualList";
import { _decorator, Label, Node, UITransform } from "cc";
const { ccclass } = _decorator;

@ccclass("TestVList")
export class TestVList extends VirtualList {
    private _pool: ReusableNodePool;

    protected onLoad(): void {
        super.onLoad();
        (<any>window)[this.node.name.toLowerCase()] = this;
        this._pool = new ReusableNodePool();
        this._dataSource = [];
    }

    protected start(): void {
        this._pool.add(this.node.parent.getChildByName("HItem"));
        this._pool.add(this.node.parent.getChildByName("VItem"));
        this._pool.add(this.node.parent.getChildByName("GItem"));
        this.data = [];
    }

    protected onDestroy(): void {
        this._pool.clear();
        super.onDestroy();
    }

    protected appendItem(index: number) {
        if (this.gridLayout) {
            return this._pool.acquire("GItem");
        } else {
            const item = this._pool.acquire(this.horizontal ? "HItem" : "VItem");
            item.on(Node.EventType.SIZE_CHANGED, this.onItemSizeChanged.bind(this, index), this);
            return item;
        }
    }

    protected renderItem(item: Node, index: number) {
        const text = this._dataSource[index];
        item.getChildByName("Label").getComponent(Label).string = text;
    }

    protected onItemSizeChanged(index: number) {
        const item = this.getItemAt(index);
        if (item) {
            const { width, height } = item.getComponent(UITransform);
            if (this.horizontal) {
                this.updateItemWidth(index, width);
            } else {
                this.updateItemHeight(index, height);
            }
        }
    }

    protected recycleItem(item: Node): void {
        this._pool.recycle(item);
        item.targetOff(this);
        item.getChildByName("Label").getComponent(Label).string = "";
        item.getComponent(UITransform).setContentSize(...this.getItemSize(0));
        item.active = false;
    }

    protected getItemSize(index: number): [number, number] {
        if (this.gridLayout) {
            return [48, 48];
        }
        if (this.horizontal) {
            return [120, 48];
        } else {
            return [640, 52];
        }
    }
}
