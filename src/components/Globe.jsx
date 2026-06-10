import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Html, Text, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';
import { toursData } from '../data/toursData';
import './Globe.css';

// Текстура Земли (высокое разрешение)
const earthTexture = "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";
const cloudTexture = "https://threejs.org/examples/textures/planets/earth_clouds_1024.png";

// Компонент маркера на глобусе
const GlobeMarker = ({ position, name, price, onClick, isActive, onHover }) => {
  const [hovered, setHovered] = useState(false);
  const markerRef = useRef();
  
  useFrame(() => {
    if (markerRef.current) {
      markerRef.current.lookAt(0, 0, 0);
    }
  });
  
  return (
    <group position={position}>
      {/* Анимированное кольцо вокруг маркера */}
      <mesh ref={markerRef} position={[0, 0, 0.55]}>
        <ringGeometry args={[0.06, 0.1, 32]} />
        <meshStandardMaterial 
          color={isActive || hovered ? "#d4af37" : "#e8b3d1"} 
          emissive={isActive || hovered ? "#d4af37" : "#c9a5e0"}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Сфера маркера */}
      <mesh
        ref={markerRef}
        position={[0, 0, 0.5]}
        onClick={onClick}
        onPointerOver={() => { setHovered(true); onHover(true, name, price, position); }}
        onPointerOut={() => { setHovered(false); onHover(false); }}
      >
        <sphereGeometry args={[0.045, 16, 16]} />
        <meshStandardMaterial 
          color={isActive || hovered ? "#d4af37" : "#c77dff"} 
          emissive={isActive || hovered ? "#d4af37" : "#c77dff"}
          emissiveIntensity={0.3}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>
    </group>
  );
};

// Компонент тултипа
const Tooltip = ({ visible, name, price, position, camera }) => {
  const [screenPos, setScreenPos] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    if (visible && position && camera) {
      const vector = new THREE.Vector3(position.x, position.y + 0.3, position.z);
      vector.project(camera);
      const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
      const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;
      setScreenPos({ x, y });
    }
  }, [visible, position, camera]);
  
  if (!visible) return null;
  
  return (
    <div 
      className="globe-tooltip"
      style={{
        position: 'fixed',
        left: screenPos.x,
        top: screenPos.y - 60,
        transform: 'translateX(-50%)',
        zIndex: 1000
      }}
    >
      <div className="tooltip-content">
        <h4>{name}</h4>
        <p>от {price.toLocaleString('ru-RU')} ₽</p>
        <button className="tooltip-btn">Подробнее</button>
      </div>
      <div className="tooltip-arrow"></div>
    </div>
  );
};

// Атмосфера вокруг Земли
const Atmosphere = () => {
  return (
    <mesh>
      <sphereGeometry args={[1.02, 64, 64]} />
      <meshPhongMaterial 
        color="#e8b3d1" 
        transparent 
        opacity={0.15}
        side={THREE.BackSide}
      />
    </mesh>
  );
};

// Облака
const Clouds = () => {
  const cloudMap = useLoader(THREE.TextureLoader, cloudTexture);
  const cloudRef = useRef();
  
  useFrame(() => {
    if (cloudRef.current) {
      cloudRef.current.rotation.y += 0.0005;
    }
  });
  
  return (
    <mesh ref={cloudRef}>
      <sphereGeometry args={[1.01, 64, 64]} />
      <meshPhongMaterial 
        map={cloudMap} 
        transparent 
        opacity={0.15}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};

// Звёздное небо
const Stars = () => {
  const [starGeometry] = useState(() => {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    for (let i = 0; i < 3000; i++) {
      const x = (Math.random() - 0.5) * 2000;
      const y = (Math.random() - 0.5) * 2000;
      const z = (Math.random() - 0.5) * 1000 - 500;
      vertices.push(x, y, z);
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    return geometry;
  });
  
  return (
    <points geometry={starGeometry}>
      <pointsMaterial color="#ffffff" size={0.35} transparent opacity={0.6} />
    </points>
  );
};

// Главный компонент глобуса
const GlobeScene = ({ onMarkerSelect, selectedTourId }) => {
  const [hoveredMarker, setHoveredMarker] = useState({ visible: false, name: '', price: 0, position: null });
  const [tooltipCamera, setTooltipCamera] = useState(null);
  const earthRef = useRef();
  const groupRef = useRef();
  const { camera } = useThree();
  
  // Получение координат для маркеров на основе названия страны
  const getCoordinates = (country) => {
    const coords = {
      'Швейцария': { lat: 46.8182, lon: 8.2275 },
      'Мальдивы': { lat: 3.2028, lon: 73.2207 },
      'Греция': { lat: 39.0742, lon: 21.8243 },
      'Французская Полинезия': { lat: -17.6797, lon: -149.4068 },
      'Япония': { lat: 36.2048, lon: 138.2529 },
      'Италия': { lat: 41.8719, lon: 12.5674 },
      'Норвегия': { lat: 60.4720, lon: 8.4689 },
      'ОАЭ': { lat: 23.4241, lon: 53.8478 },
      'Танзания': { lat: -6.3690, lon: 34.8888 },
      'Франция': { lat: 46.2276, lon: 2.2137 },
      'Индонезия': { lat: -0.7893, lon: 113.9213 },
      'Перу': { lat: -9.1900, lon: -75.0152 },
      'Багамы': { lat: 25.0343, lon: -77.3963 },
      'США': { lat: 37.0902, lon: -95.7129 },
      'Исландия': { lat: 64.9631, lon: -19.0208 },
      'Таиланд': { lat: 15.8700, lon: 100.9925 },
      'Марокко': { lat: 31.7917, lon: -7.0926 },
      'Австралия': { lat: -25.2744, lon: 133.7751 },
      'ЮАР': { lat: -30.5595, lon: 22.9375 },
      'Коста-Рика': { lat: 9.7489, lon: -83.7534 },
      'Египет': { lat: 26.8206, lon: 30.8025 },
      'Португалия': { lat: 39.3999, lon: -8.2245 },
      'Турция': { lat: 38.9637, lon: 35.2433 },
      'Сейшелы': { lat: -4.6796, lon: 55.4920 },
      'Канада': { lat: 56.1304, lon: -106.3468 },
      'Индия': { lat: 20.5937, lon: 78.9629 },
      'Чили': { lat: -35.6751, lon: -71.5430 },
      'Фиджи': { lat: -17.7134, lon: 178.0650 }
    };
    return coords[country] || { lat: 20, lon: 0 };
  };
  
  // Конвертация широты/долготы в 3D координаты
  const latLonToVector3 = (lat, lon, radius = 1.05) => {
    const phi = (90 - lat) * Math.PI / 180;
    const theta = lon * Math.PI / 180;
    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return [x, y, z];
  };
  
  // Получение уникальных стран из туров
  const uniqueCountries = [...new Map(toursData.map(tour => [tour.country, tour])).values()];
  
  // Вращение глобуса
  useFrame(() => {
    if (earthRef.current && !hoveredMarker.visible) {
      earthRef.current.rotation.y += 0.001;
    }
  });
  
  useEffect(() => {
    setTooltipCamera(camera);
  }, [camera]);
  
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} />
      
      <group ref={groupRef}>
        <mesh ref={earthRef}>
          <sphereGeometry args={[1, 128, 128]} />
          <meshStandardMaterial 
            map={useLoader(THREE.TextureLoader, earthTexture)}
            metalness={0.1}
            roughness={0.5}
            emissive="#1a1a2e"
            emissiveIntensity={0.1}
          />
        </mesh>
        
        <Atmosphere />
        <Clouds />
        
        {/* Маркеры туров */}
        {uniqueCountries.map((tour) => {
          const coords = getCoordinates(tour.country);
          const position = latLonToVector3(coords.lat, coords.lon);
          const isActive = selectedTourId === tour.id;
          
          return (
            <GlobeMarker
              key={tour.id}
              position={position}
              name={tour.name}
              price={tour.price}
              isActive={isActive}
              onClick={() => onMarkerSelect(tour.id)}
              onHover={(visible, name, price, pos) => {
                setHoveredMarker({ visible, name, price, position: pos });
              }}
            />
          );
        })}
      </group>
      
      <OrbitControls
        enableZoom={true}
        enablePan={false}
        zoomSpeed={0.8}
        rotateSpeed={0.8}
        minDistance={1.5}
        maxDistance={4}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
      
      <Tooltip 
        visible={hoveredMarker.visible}
        name={hoveredMarker.name}
        price={hoveredMarker.price}
        position={hoveredMarker.position}
        camera={tooltipCamera}
      />
    </>
  );
};

// Основной компонент
const Globe = ({ onTourSelect, selectedTourId }) => {
  const [isGlobeReady, setIsGlobeReady] = useState(false);
  
  return (
    <div className="globe-container">
      <div className="globe-header">
        <h2 className="globe-title">
          Путешествуйте по <span className="gradient-text">всему миру</span>
        </h2>
        <p className="globe-subtitle">
          Наведите на маркер, чтобы увидеть информацию о туре
        </p>
      </div>
      
      <div className="globe-wrapper">
        {!isGlobeReady && (
          <div className="globe-loader">
            <div className="loader-spinner"></div>
            <p>Загрузка 3D-глобуса...</p>
          </div>
        )}
        
        <Canvas
          className="globe-canvas"
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          onCreated={() => setIsGlobeReady(true)}
          style={{ opacity: isGlobeReady ? 1 : 0 }}
        >
          <Suspense fallback={null}>
            <GlobeScene 
              onMarkerSelect={onTourSelect} 
              selectedTourId={selectedTourId}
            />
          </Suspense>
        </Canvas>
      </div>
      
      <div className="globe-instructions">
        <span>🖱️ Вращайте глобус мышью</span>
        <span>🔍 Используйте колесико для масштабирования</span>
        <span>📍 Нажмите на маркер, чтобы перейти к туру</span>
      </div>
    </div>
  );
};

export default Globe;