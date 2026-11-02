"use client";

import { siteConfig } from '../../siteConfig';
import PetInstance from './PetInstance';
import { DEFAULT_PETS_CONFIG, PetConfig } from './petCatalog';

interface PetManagerProps {
  /** 管理端显示「宠物设置」入口，博客前台不显示。 */
  showSettingsLink?: boolean;
}

/**
 * 独立于原有 CyberCat 的宠物层。
 * 读取 siteConfig.petsConfig，按实例渲染；CyberCat 保持原样，不受影响。
 */
export default function PetManager({ showSettingsLink = false }: PetManagerProps) {
  const configured = (siteConfig as { petsConfig?: PetConfig[] }).petsConfig;
  const pets = (Array.isArray(configured) ? configured : DEFAULT_PETS_CONFIG).filter(
    (pet) => pet && pet.enabled !== false,
  );

  if (pets.length === 0) return null;

  return (
    <>
      {pets.map((pet, index) => (
        <PetInstance
          key={pet.id || `pet-${index}`}
          config={pet}
          index={index}
          showSettingsLink={showSettingsLink}
        />
      ))}
    </>
  );
}
