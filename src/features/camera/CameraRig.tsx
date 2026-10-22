"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { CameraControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import CameraControlsImpl from "camera-controls";
import { useShowroom } from "@/store/useShowroomStore";
import { HERO_VIEW, INTRO_START } from "@/features/car/config/car.config";
import type { CameraView, Vec3 } from "@/features/car/types";
import type { CameraApi, FlyOptions } from "./types";

const ACTION = CameraControlsImpl.ACTION;
const ORBIT_CENTER = new THREE.Vector3(0, 0.5, 0);
const IDLE_DELAY = 9; // seconds before the cinematic auto-orbit kicks in
const IDLE_SPEED = 0.045; // rad/s

/** Cabin volume – flights crossing it are routed through the front-right window. */
const CABIN = new THREE.Box3(new THREE.Vector3(-0.78, 0.15, -0.58), new THREE.Vector3(0.78, 1.15, 0.95));
const WINDOW_PATH: Vec3[] = [
  [2.3, 1.02, 0.25],
  [0.95, 0.98, 0.1],
];

const v = (a: Vec3) => new THREE.Vector3(...a);

/**
 * Views are authored for landscape screens. On portrait / narrow viewports the
 * vertical FOV is widened (sub-linearly, to avoid fisheye) so the car still fits.
 */
export function responsiveFov(fov: number, aspect: number) {
  const REF_ASPECT = 1.4;
  if (aspect >= REF_ASPECT) return fov;
  return Math.min(fov * Math.pow(REF_ASPECT / aspect, 0.65), fov * 2.2, 80);
}

type ControlMode = "exterior" | "orbit" | "look";

function configureControls(c: CameraControlsImpl, mode: ControlMode, view?: CameraView, insideCabin = false) {
  const distance = c.distance;
  c.dollyToCursor = mode === "exterior";
  c.infinityDolly = false;
  c.mouseButtons.left = ACTION.ROTATE;
  c.touches.one = ACTION.TOUCH_ROTATE;

  if (mode === "look") {
    // First-person: orbit a target 1 cm ahead ≈ rotate in place. Inverted speeds
    // give the "grab the panorama" feel of a 360° viewer. Wheel/pinch → optical zoom.
    c.minDistance = c.maxDistance = 0.01;
    c.azimuthRotateSpeed = -0.32;
    c.polarRotateSpeed = -0.32;
    c.mouseButtons.wheel = ACTION.ZOOM;
    c.mouseButtons.right = ACTION.NONE;
    c.mouseButtons.middle = ACTION.NONE;
    c.touches.two = ACTION.TOUCH_ZOOM;
    c.touches.three = ACTION.NONE;
    c.minZoom = 1;
    c.maxZoom = 3.2;
    c.minPolarAngle = Math.PI * 0.18;
    c.maxPolarAngle = Math.PI * 0.82;
    return;
  }

  c.azimuthRotateSpeed = mode === "orbit" ? 0.55 : 0.9;
  c.polarRotateSpeed = mode === "orbit" ? 0.55 : 0.9;
  c.mouseButtons.wheel = ACTION.DOLLY;
  c.mouseButtons.right = ACTION.TRUCK;
  c.mouseButtons.middle = ACTION.DOLLY;
  c.touches.two = ACTION.TOUCH_DOLLY_TRUCK;
  c.touches.three = ACTION.TOUCH_TRUCK;
  c.minZoom = c.maxZoom = 1;
  c.minPolarAngle = 0.05;
  // Never dip below the showroom floor (free to look up/down inside the cabin).
  c.maxPolarAngle = insideCabin ? Math.PI * 0.9 : Math.PI * 0.495;
  const min = view?.minDistance ?? 0.35;
  const max = view?.maxDistance ?? 13;
  c.minDistance = Math.min(min, distance);
  c.maxDistance = Math.max(max, distance);
}

export function CameraRig() {
  const ref = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const idle = useRef(0);
  const flight = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const controls = ref.current;
    if (!controls) return;

    controls.smoothTime = 0.32;
    controls.draggingSmoothTime = 0.12;
    controls.restThreshold = 0.0025;
    camera.near = 0.01;
    camera.far = 120;
    camera.fov = responsiveFov(INTRO_START.fov, camera.aspect);
    camera.updateProjectionMatrix();
    controls.setLookAt(...INTRO_START.position, ...INTRO_START.target, false);
    configureControls(controls, "exterior");

    const resetIdle = () => {
      idle.current = 0;
    };
    controls.addEventListener("controlstart", resetIdle);
    controls.addEventListener("control", resetIdle);

    const flyTo = (view: CameraView, opts: FlyOptions = {}) =>
      new Promise<void>((resolve) => {
        flight.current?.kill();
        const fromPos = controls.getPosition(new THREE.Vector3());
        const fromTarget = controls.getTarget(new THREE.Vector3());
        const toPos = v(view.position);
        const toTarget = v(view.target);
        const fromFov = camera.fov;
        const toFov = view.fov ? responsiveFov(view.fov, camera.aspect) : fromFov;
        const fromZoom = camera.zoom;

        const inside = (p: THREE.Vector3) => CABIN.containsPoint(p);
        const crossing = inside(fromPos) !== inside(toPos);
        const exteriorArc = !inside(fromPos) && !inside(toPos);

        // Path: spherical arc around the car outside; spline through the window when entering/leaving.
        let samplePos: (t: number, out: THREE.Vector3) => THREE.Vector3;
        if (crossing) {
          const via = WINDOW_PATH.map(v);
          const pts = inside(fromPos) ? [fromPos, ...via.reverse(), toPos] : [fromPos, ...via, toPos];
          const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0.5);
          samplePos = (t, out) => curve.getPoint(t, out);
        } else if (exteriorArc) {
          const a = new THREE.Spherical().setFromVector3(fromPos.clone().sub(ORBIT_CENTER));
          const b = new THREE.Spherical().setFromVector3(toPos.clone().sub(ORBIT_CENTER));
          let dTheta = b.theta - a.theta;
          if (dTheta > Math.PI) dTheta -= Math.PI * 2;
          if (dTheta < -Math.PI) dTheta += Math.PI * 2;
          // Sweeping far around the car? Pull out slightly mid-flight so the camera
          // breathes away from the bodywork instead of skimming it.
          const swell = Math.min(1.4, Math.abs(dTheta) * 0.45) * Math.min(a.radius, b.radius) * 0.18;
          const s = new THREE.Spherical();
          samplePos = (t, out) => {
            s.radius = THREE.MathUtils.lerp(a.radius, b.radius, t) + Math.sin(Math.PI * t) * swell;
            s.phi = Math.min(Math.PI * 0.495, THREE.MathUtils.lerp(a.phi, b.phi, t));
            s.theta = a.theta + dTheta * t;
            return out.setFromSpherical(s).add(ORBIT_CENTER);
          };
        } else {
          samplePos = (t, out) => out.lerpVectors(fromPos, toPos, t);
        }

        const travel = fromPos.distanceTo(toPos) + fromTarget.distanceTo(toTarget) * 0.5;
        const duration = opts.duration ?? THREE.MathUtils.clamp(1.25 + travel * 0.17, 1.4, crossing ? 3.2 : 2.6);

        controls.enabled = false;
        controls.minDistance = 0.0001;
        controls.maxDistance = Infinity;
        controls.minPolarAngle = 0;
        controls.maxPolarAngle = Math.PI;
        useShowroom.getState().setFlying(true);

        const state = { t: 0 };
        const p = new THREE.Vector3();
        const tg = new THREE.Vector3();
        flight.current = gsap.to(state, {
          t: 1,
          duration,
          ease: opts.ease ?? "power3.inOut",
          onUpdate: () => {
            samplePos(state.t, p);
            tg.lerpVectors(fromTarget, toTarget, state.t);
            camera.fov = THREE.MathUtils.lerp(fromFov, toFov, state.t);
            camera.zoom = THREE.MathUtils.lerp(fromZoom, 1, state.t);
            camera.updateProjectionMatrix();
            controls.setLookAt(p.x, p.y, p.z, tg.x, tg.y, tg.z, false);
          },
          onComplete: () => {
            if (view.control === "look") {
              // Re-seat the target 1 cm ahead along the final view direction.
              const dir = toTarget.clone().sub(toPos).normalize();
              const t = toPos.clone().addScaledVector(dir, 0.01);
              controls.setLookAt(toPos.x, toPos.y, toPos.z, t.x, t.y, t.z, false);
              configureControls(controls, "look", view);
            } else {
              const insideCabin = inside(toPos);
              const detail = insideCabin || view.minDistance !== undefined;
              configureControls(controls, detail ? "orbit" : "exterior", view, insideCabin);
            }
            controls.enabled = true;
            idle.current = 0;
            useShowroom.getState().setFlying(false);
            resolve();
          },
        });
      });

    const api: CameraApi = {
      flyTo,
      playIntro: () => flyTo({ ...HERO_VIEW }, { duration: 4.6, ease: "power2.inOut" }),
      resetZoom: () => {
        gsap.to(camera, {
          zoom: 1,
          duration: 0.8,
          ease: "power2.out",
          onUpdate: () => camera.updateProjectionMatrix(),
        });
      },
    };
    useShowroom.getState().registerCamera(api);

    // Intro: the loading screen hands over with phase "intro"; the reveal flight ends in "ready".
    const unsubPhase = useShowroom.subscribe(
      (s) => s.phase,
      (phase) => {
        if (phase === "intro") api.playIntro().then(() => useShowroom.getState().setPhase("ready"));
      },
    );

    return () => {
      unsubPhase();
      flight.current?.kill();
      controls.removeEventListener("controlstart", resetIdle);
      controls.removeEventListener("control", resetIdle);
      useShowroom.getState().registerCamera(null);
    };
  }, [camera]);

  // Cinematic idle orbit – only on the free exterior view.
  useFrame((_, delta) => {
    const controls = ref.current;
    if (!controls) return;
    const s = useShowroom.getState();
    if (s.phase !== "ready" || s.mode !== "exterior" || s.activeFocus || s.isFlying || s.panelOpen) {
      idle.current = 0;
      return;
    }
    idle.current += delta;
    if (idle.current > IDLE_DELAY) {
      const ramp = Math.min(1, (idle.current - IDLE_DELAY) / 3);
      controls.rotate(IDLE_SPEED * ramp * delta, 0, false);
    }
  });

  return <CameraControls ref={ref} makeDefault />;
}
