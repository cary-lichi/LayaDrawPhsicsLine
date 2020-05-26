(function () {
    'use strict';

    var REG = Laya.ClassUtils.regClass;
    var ui;
    (function (ui) {
        var test;
        (function (test) {
            class TestSceneUI extends Laya.Scene {
                constructor() { super(); }
                createChildren() {
                    super.createChildren();
                    this.loadScene("test/TestScene");
                }
            }
            test.TestSceneUI = TestSceneUI;
            REG("ui.test.TestSceneUI", TestSceneUI);
        })(test = ui.test || (ui.test = {}));
    })(ui || (ui = {}));

    var ColliderBase = Laya.ColliderBase;
    var Physics = Laya.Physics;
    class Point {
    }
    class RectLineCollider extends ColliderBase {
        constructor() {
            super(...arguments);
            this._lineWidth = 5;
            this._fixtures = [];
        }
        set lineWidth(val) {
            this._lineWidth = val;
        }
        setPoints(points, re = true) {
            if (points == null || points.length < 2)
                return;
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
            if (re)
                this.refresh();
        }
        refresh() {
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
        _onDestroy() {
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

    var Sprite = Laya.Sprite;
    var RigidBody = Laya.RigidBody;
    var Physics$1 = Laya.Physics;
    class DrawLine {
        addLine() {
            var prevX = 0;
            var prevY = 0;
            var line = null;
            var points = null;
            var color = "#80da64";
            var dashedPathColor = "#047020";
            var lineSize = 5;
            var lineLength = 5;
            var dashedPath;
            Laya.stage.on(Laya.Event.MOUSE_DOWN, this, (e) => {
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
                points.push({ x: prevX, y: prevY });
            });
            Laya.stage.on(Laya.Event.MOUSE_MOVE, this, (e) => {
                let distance = this.distance(Laya.stage.mouseX, Laya.stage.mouseY, prevX, prevY);
                if (points == null || points.length == 0) {
                    return;
                }
                if (distance > lineLength) {
                    dashedPath.graphics.clear();
                    var rayHit = new Object();
                    if (!this.rayCast(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, rayHit)) {
                        line.graphics.drawLine(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, color, lineSize);
                        prevX = Laya.stage.mouseX;
                        prevY = Laya.stage.mouseY;
                        points.push({ x: prevX, y: prevY });
                    }
                    else {
                        dashedPath.graphics.drawLine(prevX, prevY, Laya.stage.mouseX, Laya.stage.mouseY, dashedPathColor, lineSize);
                    }
                }
            });
            Laya.stage.on(Laya.Event.MOUSE_UP, this, (e) => {
                if (points != null && points.length > 2) {
                    var col = line.addComponent(RectLineCollider);
                    col.setPoints(points);
                    var rb = line.addComponent(RigidBody);
                    rb.allowRotation = true;
                }
                else {
                    line.destroy();
                    line = null;
                }
                dashedPath.destroy();
                dashedPath = null;
                points = null;
            });
        }
        rayCast(startX, startY, endX, endY, outHitInfo) {
            var world = Physics$1.I.world;
            var result = 0;
            world.RayCast((fixture, point, normal, fraction) => {
                outHitInfo.fixture = fixture;
                outHitInfo.point = point;
                outHitInfo.normal = normal;
                outHitInfo.fraction = fraction;
                result = 1;
                return 0;
            }, {
                x: startX / Physics$1.PIXEL_RATIO,
                y: startY / Physics$1.PIXEL_RATIO
            }, {
                x: endX / Physics$1.PIXEL_RATIO,
                y: endY / Physics$1.PIXEL_RATIO
            });
            return !!result;
        }
        distance(x1, y1, x2, y2) {
            let dx = x2 - x1;
            let dy = y2 - y1;
            return Math.sqrt(dx * dx + dy * dy);
        }
    }

    class GameUI extends ui.test.TestSceneUI {
        constructor() {
            super();
            GameUI.instance = this;
            Laya.MouseManager.multiTouchEnabled = false;
        }
        onEnable() {
            let line = new DrawLine();
            line.addLine();
        }
    }

    class GameConfig {
        constructor() {
        }
        static init() {
            var reg = Laya.ClassUtils.regClass;
            reg("script/GameUI.ts", GameUI);
        }
    }
    GameConfig.width = 640;
    GameConfig.height = 1136;
    GameConfig.scaleMode = "fixedwidth";
    GameConfig.screenMode = "none";
    GameConfig.alignV = "top";
    GameConfig.alignH = "left";
    GameConfig.startScene = "test/TestScene.scene";
    GameConfig.sceneRoot = "";
    GameConfig.debug = false;
    GameConfig.stat = false;
    GameConfig.physicsDebug = false;
    GameConfig.exportSceneToJson = true;
    GameConfig.init();

    class Main {
        constructor() {
            if (window["Laya3D"])
                Laya3D.init(GameConfig.width, GameConfig.height);
            else
                Laya.init(GameConfig.width, GameConfig.height, Laya["WebGL"]);
            Laya["Physics"] && Laya["Physics"].enable();
            Laya["DebugPanel"] && Laya["DebugPanel"].enable();
            Laya.stage.scaleMode = GameConfig.scaleMode;
            Laya.stage.screenMode = GameConfig.screenMode;
            Laya.stage.alignV = GameConfig.alignV;
            Laya.stage.alignH = GameConfig.alignH;
            Laya.URL.exportSceneToJson = GameConfig.exportSceneToJson;
            if (GameConfig.debug || Laya.Utils.getQueryString("debug") == "true")
                Laya.enableDebugPanel();
            if (GameConfig.physicsDebug && Laya["PhysicsDebugDraw"])
                Laya["PhysicsDebugDraw"].enable();
            if (GameConfig.stat)
                Laya.Stat.show();
            Laya.alertGlobalError(true);
            Laya.ResourceVersion.enable("version.json", Laya.Handler.create(this, this.onVersionLoaded), Laya.ResourceVersion.FILENAME_VERSION);
        }
        onVersionLoaded() {
            Laya.AtlasInfoManager.enable("fileconfig.json", Laya.Handler.create(this, this.onConfigLoaded));
        }
        onConfigLoaded() {
            GameConfig.startScene && Laya.Scene.open(GameConfig.startScene);
        }
    }
    new Main();

}());
