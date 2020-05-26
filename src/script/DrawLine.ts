
// import Physics = Laya.Physics;
import Sprite = Laya.Sprite;
import RigidBody = Laya.RigidBody;
import Physics = Laya.Physics;
import PhysicsDebugDraw = Laya.PhysicsDebugDraw;

import RectLineCollider, { Point } from "./RectLineCollider";

export default class DrawLine {
    public addLine(): void {
        // Physics.enable({ gravity: 50000 });

        // PhysicsDebugDraw.enable();
        var prevX: number = 0;
        var prevY: number = 0;
        var line: Sprite = null;
        var points: Point[] = null;
        var color = "#80da64";
        var dashedPathColor = "#047020";
        var lineSize: number = 5;
        var lineLength: number = 5;
        var dashedPath: Sprite;

        Laya.stage.on(Laya.Event.MOUSE_DOWN, this, (e: Laya.Event) => {
            if (points) {
                return;
            }

            points = [];

            prevX = Laya.stage.mouseX;
            prevY = Laya.stage.mouseY;

            line = new Sprite();
            line.mouseEnabled = false;
            Laya.stage.addChild(line);

            dashedPath = new Sprite();
            Laya.stage.addChild(dashedPath);
            points.push(<Point>{ x: prevX, y: prevY });
        });

        Laya.stage.on(Laya.Event.MOUSE_MOVE, this, (e: Laya.Event) => {
            let distance = this.distance(Laya.stage.mouseX, Laya.stage.mouseY, prevX, prevY);
            if (points == null || points.length == 0) {
                return;
            }
            if (distance > lineLength) {
                //ray check
                dashedPath.graphics.clear();
                var rayHit: Object = new Object();
                if (!this.rayCast(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, rayHit)) {
                    line.graphics.drawLine(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, color, lineSize);
                    prevX = Laya.stage.mouseX;
                    prevY = Laya.stage.mouseY;
                    points.push(<Point>{ x: prevX, y: prevY });
                } else {
                    dashedPath.graphics.drawLine(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, dashedPathColor, lineSize);
                }
            }
        });

        Laya.stage.on(Laya.Event.MOUSE_UP, this, (e: Laya.Event) => {
            if (points != null && points.length > 2) {
                var col: RectLineCollider = line.addComponent(RectLineCollider);
                col.setPoints(points)
                var rb = line.addComponent(RigidBody);
                rb.allowRotation = true;

            } else {
                line.destroy();
                line = null;
            }
            dashedPath.destroy();
            dashedPath = null;
            points = null;
        });
    }

    private rayCast(startX: number, startY: number, endX: number, endY: number, outHitInfo): boolean {
        var world = Physics.I.world;
        var result: number = 0;
        world.RayCast((fixture, point, normal, fraction) => {
            outHitInfo.fixture = fixture;
            outHitInfo.point = point;
            outHitInfo.normal = normal;
            outHitInfo.fraction = fraction;
            result = 1;
            return 0;//只检测一个
        }, {
            x: startX / Physics.PIXEL_RATIO,
            y: startY / Physics.PIXEL_RATIO
        }, {
            x: endX / Physics.PIXEL_RATIO,
            y: endY / Physics.PIXEL_RATIO
        });
        return !!result;
    }

    private distance(x1: number, y1: number, x2: number, y2: number): number {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
}