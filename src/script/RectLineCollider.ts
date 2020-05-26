import ColliderBase = Laya.ColliderBase;
import Physics = Laya.Physics;

export class Point {
    x: number;
    y: number;
}

export default class RectLineCollider extends ColliderBase {
    private _lineWidth = 5;
    public set lineWidth(val: number) {
        this._lineWidth = val;
    }

    private _fixtures = [];

    public setPoints(points: Point[], re: Boolean = true): void {
        if (points == null || points.length < 2) return;

        this._shape = [];
        var len = points.length;

        for (var i = 0; i < len - 1; i++) {
            var point1 = points[i];
            var point2 = points[i + 1];
            var x1 = point1.x;
            var y1 = point1.y;
            var x2 = point2.x;
            var y2 = point2.y;
            var cx = (x1 + x2) * 0.5;
            var cy = (y1 + y2) * 0.5;

            var dx = x1 - x2;
            var dy = y1 - y2;
            var linelen = Math.sqrt(dx * dx + dy * dy);

            var angle = Math.atan2(y2 - y1, x2 - x1) - Math.PI * 0.5;

            var s = new window["box2d"].b2PolygonShape();
            s.SetAsBox(this._lineWidth / 2 / Physics.PIXEL_RATIO, linelen / 2 / Physics.PIXEL_RATIO, new window["box2d"].b2Vec2(cx / Physics.PIXEL_RATIO, cy / Physics.PIXEL_RATIO), angle);
            this._shape.push(s);
        }

        if (re) this.refresh();
    }

    public refresh(): void {
        if (this.enabled && this.rigidBody) {
            var body = this.rigidBody.body;

            if (this._fixtures.length > 0) {
                for (var j = 0; j < this._fixtures.length; ++j) {
                    if (this._fixtures[j].GetBody() == this.rigidBody.body) {
                        this.rigidBody.body.DestroyFixture(this._fixtures[j]);
                    }
                    this._fixtures[j].Destroy();
                }
                this._fixtures.length = 0;
            }

            for (var i = 0; i < this._shape.length; ++i) {
                var def = new window["box2d"].b2FixtureDef();
                def.density = this.density;
                def.friction = this.friction;
                def.isSensor = this.isSensor;
                def.restitution = this.restitution;
                def.shape = this._shape[i];
                def.filter.groupIndex = this.rigidBody.group;
                def.filter.categoryBits = this.rigidBody.category;
                def.filter.maskBits = this.rigidBody.mask;
                this.fixture = body.CreateFixture(def);
                this.fixture.collider = this;
            }
        }
    }


    protected _onDestroy(): void {
        if (this.rigidBody) {
            if (this._fixtures.length > 0) {
                for (var i = 0; i < this._fixtures.length; ++i) {
                    if (this._fixtures[i].GetBody() == this.rigidBody.body) {
                        this.rigidBody.body.DestroyFixture(this._fixtures[i]);
                    }
                }
                this._fixtures.length = 0;
            }
            this.rigidBody = null;
            this._shape = null;
        }
    }
}