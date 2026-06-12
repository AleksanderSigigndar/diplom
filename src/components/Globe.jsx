import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { toursData } from '../data/toursData';
import './Globe.css';

const earthTexture = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const cloudTexture = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";

// Координаты городов
const cityCoordinates = {
  'Церматт': { lat: 46.0, lon: -7.7 },
  'Позитано': { lat: 40.6, lon: -15.5 },
  'Ойя': { lat: 38.5, lon: -22.4 },
  'Миконос': { lat: 37.5, lon: -25.3 },
  'Сен-Тропе': { lat: 43.3, lon: -6.6 },
  'Тромсё': { lat: 69.6, lon: -18.0 },
  'Рейкьявик': { lat: 64.1, lon: -21.9 },
  'Дору': { lat: 41.1, lon: 6.9 },
  'Каппадокия': { lat: 38.6, lon: -34.8 },
  'Банф': { lat: 51.2, lon: 115.6 },
  'Нью-Йорк': { lat: 41.7, lon: 73.0 },
  'Мауи': { lat: 20.8, lon: 155.3 },
  'Нассау': { lat: 25.0, lon: 77.4 },
  'Ла-Фортуна': { lat: 10.5, lon: 83.6 },
  'Куско': { lat: -13.5, lon: 71.0 },
  'Торрес-дель-Пайне': { lat: -41.0, lon: 70.0 },
  'Киото': { lat: 35.0, lon: 221.8 },
  'Северный Мале': { lat: 4.2, lon: -73.5 },
  'Дубай': { lat: 25.3, lon: -55.3 },
  'Убуд': { lat: -8.5, lon: -115.3 },
  'Пхукет': { lat: 7.9, lon: -98.4 },
  'Джайпур': { lat: 26.9, lon: -75.8 },
  'Серенгети': { lat: -2.3, lon: -34.8 },
  'Марракеш': { lat: 31.6, lon: 7.0 },
  'Кейптаун': { lat: -31.9, lon: -18.4 },
  'Луксор': { lat: 25.7, lon: -32.6 },
  'Маэ': { lat: -4.7, lon: -55.5 },
  'Бора-Бора': { lat: -16.5, lon: 151.7 },
  'Нанди': { lat: -17.8, lon: -177.4 },
  'Сидней': { lat: -33.9, lon: -151.2 },
};

const getCityCoordinates = (city) => cityCoordinates[city] || { lat: 20, lon: 0 };

const latLonToXYZ = (lat, lon, radius = 1.0) => {
  const phi = (90 - lat) * Math.PI / 180;
  const theta = lon * Math.PI / 180;
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  ];
};

const GlobeMarker = ({ position, name, price, city, country, onClick, isActive, onHoverChange, cameraDistance }) => {
  const [hovered, setHovered] = useState(false);
  
  const minSize = 0.008;
  const maxSize = 0.03;
  const minDistance = 1.2;
  const maxDistance = 3.5;
  
  let normalizedDistance = (cameraDistance - minDistance) / (maxDistance - minDistance);
  normalizedDistance = Math.max(0, Math.min(1, normalizedDistance));
  const markerSize = minSize + normalizedDistance * (maxSize - minSize);
  
  return (
    <group position={position}>
      {hovered && (
        <mesh>
          <sphereGeometry args={[markerSize * 2, 16, 16]} />
          <meshStandardMaterial 
            color="#d4af37" 
            transparent 
            opacity={0.4}
            emissive="#d4af37"
            emissiveIntensity={0.3}
          />
        </mesh>
      )}
      
      <mesh
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => { setHovered(true); onHoverChange(true); }}
        onPointerOut={() => { setHovered(false); onHoverChange(false); }}
      >
        <sphereGeometry args={[markerSize, 16, 16]} />
        <meshStandardMaterial 
          color={isActive || hovered ? "#ffd700" : "#c77dff"} 
          emissive={isActive || hovered ? "#d4af37" : "#c77dff"}
          emissiveIntensity={hovered ? 0.5 : 0.2}
          metalness={0.4}
          roughness={0.3}
        />
      </mesh>
      
      {hovered && (
        <Html distanceFactor={1.2}>
          <div className="globe-marker-tooltip">
            <div className="tooltip-title">{name}</div>
            <div className="tooltip-location">{city}, {country}</div>
            <div className="tooltip-price">от {price.toLocaleString('ru-RU')} ₽</div>
          </div>
        </Html>
      )}
    </group>
  );
};

const Atmosphere = () => (
  <mesh>
    <sphereGeometry args={[1.02, 64, 64]} />
    <meshPhongMaterial color="#e8b3d1" transparent opacity={0.08} side={THREE.BackSide} />
  </mesh>
);

const Clouds = () => {
  const cloudMap = useLoader(THREE.TextureLoader, cloudTexture);
  const cloudRef = useRef();
  useFrame(() => {
    if (cloudRef.current) cloudRef.current.rotation.y += 0.0005;
  });
  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[1.01, 64, 64]} />
      <meshPhongMaterial map={cloudMap} transparent opacity={0.1} blending={THREE.AdditiveBlending} />
    </mesh>
  );
};

const Stars = () => {
  const geometry = new THREE.BufferGeometry();
  const vertices = [];
  for (let i = 0; i < 3000; i++) {
    vertices.push((Math.random() - 0.5) * 2000);
    vertices.push((Math.random() - 0.5) * 2000);
    vertices.push((Math.random() - 0.5) * 1000 - 500);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
  return <points geometry={geometry}><pointsMaterial color="#ffffff" size={0.3} transparent opacity={0.6} /></points>;
};

const CameraTracker = ({ onDistanceChange }) => {
  const { camera } = useThree();
  
  useFrame(() => {
    const distance = camera.position.length();
    onDistanceChange(distance);
  });
  
  return null;
};

const GlobeScene = ({ onMarkerSelect, selectedTourId }) => {
  const earthRef = useRef();
  const [isHovering, setIsHovering] = useState(false);
  const [cameraDistance, setCameraDistance] = useState(2.5);
  const rotationSpeed = 0.001;
  
  const uniqueCities = new Map();
  toursData.forEach(tour => {
    if (!uniqueCities.has(tour.city)) {
      uniqueCities.set(tour.city, tour);
    }
  });
  const uniqueTours = Array.from(uniqueCities.values());
  
  const toursWithCoords = uniqueTours.map(tour => ({
    ...tour,
    coords: getCityCoordinates(tour.city)
  }));
  
  useFrame(() => {
    if (earthRef.current && !isHovering) {
      earthRef.current.rotation.y += rotationSpeed;
    }
  });
  
  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      
      <CameraTracker onDistanceChange={setCameraDistance} />
      
      <group ref={earthRef}>
        <mesh>
          <sphereGeometry args={[1, 128, 128]} />
          <meshStandardMaterial map={useLoader(THREE.TextureLoader, earthTexture)} />
        </mesh>
        
        {toursWithCoords.map((tour) => {
          const pos = latLonToXYZ(tour.coords.lat, tour.coords.lon, 1.01);
          return (
            <GlobeMarker
              key={tour.id}
              position={pos}
              name={tour.name}
              price={tour.price}
              city={tour.city}
              country={tour.country}
              isActive={selectedTourId === tour.id}
              onClick={() => onMarkerSelect(tour.id)}
              onHoverChange={setIsHovering}
              cameraDistance={cameraDistance}
            />
          );
        })}
      </group>
      
      <Atmosphere />
      <Clouds />
      <Stars />
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        zoomSpeed={1.0}
        rotateSpeed={0.8}
        minDistance={1.2}
        maxDistance={3.5}
      />
    </>
  );
};

const Globe = ({ onTourSelect, selectedTourId }) => {
  const [ready, setReady] = useState(false);
  
  return (
    <div className="globe-container">
      <div className="globe-header">
        <h2>Путешествуйте по <span className="gradient-text">всему миру</span></h2>
        <p>Наведите на маркер, чтобы увидеть информацию о туре</p>
      </div>
      
      <div className="globe-wrapper">
        {!ready && (
          <div className="globe-loader">
            <div className="loader-spinner"></div>
            <p>Загрузка глобуса...</p>
          </div>
        )}
        
        <Canvas camera={{ position: [0, 0, 2.5], fov: 45 }} onCreated={() => setReady(true)} style={{ opacity: ready ? 1 : 0 }}>
          <Suspense fallback={null}>
            <GlobeScene onMarkerSelect={onTourSelect} selectedTourId={selectedTourId} />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="globe-instructions">
        <span>Вращайте глобус мышью</span>
        <span>Колесико для масштаба</span>
        <span>Нажмите на маркер → переход к туру</span>
        <span>При наведении вращение останавливается</span>
      </div>
    </div>
  );
};

export default Globe;