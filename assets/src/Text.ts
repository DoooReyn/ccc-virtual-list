/** 文本 */
export const TEXT = {
    PARAMETER: "基础参数",
    DEBUG_DRAW: "调试绘制",
    DEBUG_DRAW_TIP: "绘制视图调试框，方便开发阶段发现问题",
    SCROLL_DIRECTION: "滚动方向",
    SCROLL_DIRECTION_TIP: "分为水平滚动和垂直滚动",
    LAYOUT_MODE: "布局方式",
    LAYOUT_MODE_TIP: "分为单项布局和网格布局\n单项即一行或一列只有一个子项\n网格即一行或一列有多个子项",
    SPACING: "子项间距",
    SPACING_TIP: "每个子项之间的间隔",
    STICK_AT_END: "自动滚到底部",
    STICK_AT_END_TIP: "此开关在聊天这种场景很有用",
    EMPTY_NODE: "空白列表提示",
    EMPTY_NODE_TIP: "当列表为空时显示的节点，不设置则不显示",
    PADDING: "边距",
    PADDING_LEFT: "左边距",
    PADDING_RIGHT: "右边距",
    PADDING_TOP: "上边距",
    PADDING_BOTTOM: "下边距",
    PADDING_LEFT_TIP: "与视图左侧的距离",
    PADDING_RIGHT_TIP: "与视图右侧的距离",
    PADDING_TOP_TIP: "与视图顶部的距离",
    PADDING_BOTTOM_TIP: "与视图底部的距离",
    INERTIA: "惯性滚动",
    INERTIA_SWITCHER: "惯性滚动开关",
    INERTIA_SWITCHER_TIP: "是否开启惯性滚动",
    SCROLL_SPEED: "滚动倍速",
    SCROLL_SPEED_TIP: "可以调节滚动速度",
    SCROLL_DELTA: "滚动阈值（毫秒）",
    SCROLL_DELTA_TIP: "从触摸开始到触摸结束，如果时间差大于此值则不会触发惯性滚动",
    SCROLL_SPAN: "滚动阈值（像素）",
    SCROLL_SPAN_TIP: "出触摸开始到触摸结束，如果触摸移动距离小于此值则不会触发惯性滚动",
    BOUNCE: "回弹",
    BOUNCE_SWITCHER: "回弹开关",
    BOUNCE_SWITCHER_TIP: "是否在超出视图边界时启用回弹",
    BOUNCE_TIME: "回弹时间（秒）",
    BOUNCE_TIME_TIP: "回弹动画的持续时间",
    GRID: "网格参数",
    GRID_COLUMN: "网格数量",
    GRID_COLUMN_TIP: "网格布局时，每行显示的子项数量",
    SCROLL_BAR: "滚动条",
    SCROLL_BAR_SWITCHER: "显示滚动条",
    SCROLL_BAR_SWITCHER_TIP: "是否启用滚动条",
    SCROLL_BAR_COLOR: "滚动条颜色",
    SCROLL_BAR_COLOR_TIP: "可以调整滚动条的颜色",
    SCROLL_BAR_SIZE: "滑块扁度",
    SCROLL_BAR_SIZE_TIP: "可以调整滚动条的扁度\n因为水平滚动时是高度，垂直滚动时是宽度，所以统称为扁度",
    SCROLL_BAR_TIME: "滑块显示时间（秒）",
    SCROLL_BAR_TIME_TIP: "可以设定滑块出现多久后自动消失",
} as const;
