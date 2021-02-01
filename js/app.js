import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'js/GLTFLoader.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PostProcessing } from './postprocessing';

import fragment from './shader/fragment.glsl';
import fragment1 from './shader/fragment1.glsl';
import vertex from './shader/vertex.glsl';
import * as dat from 'dat.gui';
// import gsap from 'gsap';

import earth from '../img/Earth2.jpg';

export default class Sketch {
  constructor(options) {
    this.scene = new THREE.Scene();
    this.container = options.dom;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x111111, 1);
    this.renderer.physicallyCorrectLights = true;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    
    // not sure if needed here
    // this.container = document.getElementById("container");
    this.container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(
      70, 
      window.innerWidth / window.innerHeight, 
      0.001, 
      1000
    );

    // let frustumSize = 1;
    // let aspect = window.innerWidth / window.innerHeight;
    // this.camera = new THREE.OrthographicCamera(
    //   frustumSize / -2, frustumSize / 2, frustumSize / 2, frustumSize / -2, -1000, 1000
    // );
    this.camera.position.set(0, 0, 2);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.time = 0;

    this.isPlaying = true;

    this.mouse = 0;

    this.addObjects();
    this.mouseEvent();
    this.addPost();
    this.resize();
    this.render();
    this.setupResize();
    
    this.settings();
  }

  mouseEvent() {
    this.lastX = 0;
    this.lastY = 0;
    this.speed = 0;
    document.addEventListener('mousemove', (e)=>{
      this.speed = Math.sqrt((e.pageX - this.lastX)**2 + (e.pageY - this.lastY)**2)*0.1;
      this.lastX = e.pageX;
      this.lastY = e.pageY;
    })
  }

  addPost() {
    this.composer = new EffectComposer( this.renderer );
				this.composer.addPass( new RenderPass( this.scene, this.camera ) );

				this.customPass = new ShaderPass( PostProcessing );
				this.customPass.uniforms[ 'resolution' ].value = new THREE.Vector2( window.innerWidth, window.innerHeight );
				this.customPass.uniforms[ 'resolution' ].value.multiplyScalar( window.devicePixelRatio );
				this.composer.addPass( this.customPass );
  }

  settings() {
    this.settings = {
      rgbShift: 1,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, 'rgbShift', 0, 1, 0.01);
  }

  setupResize() {
    window.addEventListener('resize', this.resize.bind(this));
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.composer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    

    //image convert
    this.imageAspect = 2592/3872;
    let a1;
    let a2;
    if(this.height/this.width>this.imageAspect) {
      a1 = (this.width/this.height) * this.imageAspect;
      a2 = 1;
    } else {
      a1 = 1;
      a2 = (this.height/this.width) / this.imageAspect;
    }
    
    this.material.uniforms.resolution.value.x = this.width;
    this.material.uniforms.resolution.value.y = this.height;
    this.material.uniforms.resolution.value.z = a1;
    this.material.uniforms.resolution.value.w = a2;

    // this.camera.fov =
    //   2 *
    //   Math.atan(this.width / this.camera.aspect / (2 * this.cameraDistance)) *
    //   (180 / Math.PI); // in degrees

    this.camera.updateProjectionMatrix();
  }

  addObjects() {
    // let that = this;
    let t = new THREE.TextureLoader().load(earth);
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        mouse: { value: 0 },
        progress: { value: 0 },
        // texture1: { value: null },
        earth: { value: t },
        // t2: { value: new THREE.TextureLoader().load(blog) },
        resolution: { value: new THREE.Vector4() },
        uvRate1: { value: new THREE.Vector2(1, 1) },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment
    });
    this.material1 = new THREE.ShaderMaterial({
      extensions: {
        derivatives: "#extension GL_OES_standard_derivatives : enable"
      },
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        mouse: { value: 0 },
        progress: { value: 0 },
        // texture1: { value: null },
        earth: { value: t },
        // t2: { value: new THREE.TextureLoader().load(blog) },
        resolution: { value: new THREE.Vector4() },
        uvRate1: { value: new THREE.Vector2(1, 1) },
      },
      // wireframe: true,
      // transparent: true,
      vertexShader: vertex,
      fragmentShader: fragment1
    });
    this.geometry = new THREE.IcosahedronGeometry(1,1);
    this.geometry1 = new THREE.IcosahedronBufferGeometry(1.001,1);
    let length = this.geometry1.attributes.position.array.length;

    // alert(length);

    let bary = [];
    for(let i = 0; i < length/3; i++) {
      bary.push(0,0,1, 0,1,0, 1,0,0)
    }

    let aBary = new Float32Array(bary);
    this.geometry1.setAttribute('aBary', new THREE.BufferAttribute(aBary, 3));


    this.ico = new THREE.Mesh(this.geometry1, this.material);
    this.icoLines = new THREE.Mesh(this.geometry1, this.material1);
    this.scene.add(this.ico);
    this.scene.add(this.icoLines);
  }

  stop() {
    this.isPlaying = false;
  }

  play() {
    if (!this.isPlaying) {
      this.render()
      this.isPlaying = true;
    }
  }

  render() {
    if (!this.isPlaying) return;
    this.time += 0.001;
    this.mouse -= (this.mouse - this.speed)*0.05;
    this.speed *= 0.99;
    this.scene.rotation.x = this.time;
    this.scene.rotation.y = this.time;
    this.customPass.uniforms.time.value = this.time;
    this.customPass.uniforms.rgbShift.value = this.mouse/5;
    this.material.uniforms.time.value = this.time;
    this.material.uniforms.mouse.value = this.mouse;
    this.material.uniforms.mouse.value = this.mouse;
    // this.material.uniforms.progress.value = this.settings.progress;
    requestAnimationFrame(this.render.bind(this));
    // this.renderer.render(this.scene, this.camera);
    this.composer.render();
  }
}

new Sketch({
  dom: document.getElementById('container')
});