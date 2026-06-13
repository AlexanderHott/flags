import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { motion } from "motion/react";
import { cn } from "../lib/utils";
import { Button } from "#/components/ui/button";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <HeroGeometric color1="#21123b" color2="#a77bf5" speed={1}>
      <div className="flex flex-col w-screen h-screen">
        <nav className="p-2 flex justify-end">
          <Button asChild>
            <Link to="/login">Login</Link>
          </Button>
        </nav>

        <div className="flex flex-col h-full items-center justify-center">
            <h1 className="p-4 text-center text-foreground text-6xl font-bold">Feature Flags</h1>
        </div>
      </div>
    </HeroGeometric>
  );
}

// --- Shader Code ---
const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform float uTime;
uniform vec2 uResolution;
uniform vec3 uColor1;
uniform vec3 uColor2;
varying vec2 vUv;

vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
           -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
  + i.x + vec3(0.0, i1.x, 1.0 ));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

float bayerDither4x4(vec2 uv) {
    int x = int(mod(uv.x, 4.0));
    int y = int(mod(uv.y, 4.0));
    
    int matrix[16];
    matrix[0] = 0; matrix[1] = 8; matrix[2] = 2; matrix[3] = 10;
    matrix[4] = 12; matrix[5] = 4; matrix[6] = 14; matrix[7] = 6;
    matrix[8] = 3; matrix[9] = 11; matrix[10] = 1; matrix[11] = 9;
    matrix[12] = 15; matrix[13] = 7; matrix[14] = 13; matrix[15] = 5;
    
    return float(matrix[y * 4 + x]) / 16.0;
}

void main() {
    vec2 uv = vUv;
    vec2 coord = gl_FragCoord.xy;
    
    // Enhanced noise with time
    float noise = snoise(uv * 1.5 + vec2(uTime * 0.05, uTime * 0.03)) * 0.25;
    
    // Diagonal gradient from bottom-left to top-right
    float diagonal = (uv.x + uv.y) * 0.5;
    
    // Combine for gradient - emphasize corners
    float gradient = diagonal * 1.2 + noise;
    
    // Interpolate colors based on gradient
    vec3 deepBlue = uColor1;
    vec3 paleBlue = uColor2;
    vec3 softBlue = mix(deepBlue, paleBlue, 0.33);
    vec3 lightBlue = mix(deepBlue, paleBlue, 0.66);
    
    // Map to colors with more distinct steps
    vec3 color;
    if (gradient < 0.3) {
        color = deepBlue;
    } else if (gradient < 0.55) {
        color = softBlue;
    } else if (gradient < 0.8) {
        color = lightBlue;
    } else {
        color = paleBlue;
    }
    
    // Enhanced dithering at boundaries
    float dither = bayerDither4x4(coord);
    float threshold = fract(gradient * 4.0);
    
    if (gradient < 0.3 && threshold > dither * 0.5) {
        color = softBlue;
    } else if (gradient >= 0.3 && gradient < 0.55 && threshold > dither * 0.5) {
        color = lightBlue;
    } else if (gradient >= 0.55 && gradient < 0.8 && threshold > dither * 0.5) {
        color = paleBlue;
    }
    
    // Softer fade to white - only at extreme bottom-left
    // vec2 cornerDist = vec2(uv.x, uv.y);
    // float fadeMask = smoothstep(0.0, 0.25, length(cornerDist));
    // color = mix(vec3(1.0), color, fadeMask);
    
    // Add subtle vignette to emphasize corners
    float vignette = smoothstep(1.2, 0.3, length(uv - 0.5));
    color = mix(color, color * 0.95, (1.0 - vignette) * 0.3);
    
    gl_FragColor = vec4(color, 1.0);
}
`;

const GradientCanvas = ({
  color1,
  color2,
  speed = 1,
}: {
  color1: string;
  color2: string;
  speed?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
    });
    renderer.setPixelRatio(1);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const timer = new THREE.Timer();
    const uniforms = {
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1000, 1000) },
      uColor1: { value: new THREE.Color(color1) },
      uColor2: { value: new THREE.Color(color2) },
    };
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect();
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    if (typeof document !== "undefined") {
      timer.connect(document);
    }

    let animationFrame = 0;
    const render = (timestamp: number) => {
      timer.update(timestamp);
      uniforms.uTime.value = timer.getElapsed() * speed;
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
      observer.disconnect();
      timer.dispose();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [color1, color2, speed]);

  return <canvas ref={canvasRef} className="block h-full w-full" />;
};

// --- Main Component ---

interface HeroGeometricProps {
  className?: string; // Explicitly included
  color1?: string;
  color2?: string;
  speed?: number;
  children: ReactNode;
}

function HeroGeometric({
  color1 = "#3B82F6", // Default soft blue
  color2 = "#F0F9FF", // Default pale blue
  speed = 1,
  className,
  children,
}: HeroGeometricProps) {
  return (
    <div
      className={cn(
        "relative w-full min-h-screen flex flex-col items-center overflow-hidden bg-white text-black",
        className,
      )}
      style={{ containerType: "size" }}
    >
      {/* Background Shader */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <GradientCanvas color1={color1} color2={color2} speed={speed} />
      </div>

      <div className="relative z-10 h-full w-full">{children}</div>
    </div>
  );
}
