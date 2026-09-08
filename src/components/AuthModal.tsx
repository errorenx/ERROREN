import React from 'react';
import { AccountModal } from './AccountModal';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  currentProfile?: UserProfile | null;
  onSaveProfile?: (profile: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentProfile = null,
  onSaveProfile = () => {},
}) => {
  return (
    <AccountModal
      isOpen={isOpen}
      onClose={onClose}
      currentProfile={currentProfile}
      onSaveProfile={profile => {
        onSaveProfile(profile);
        onSuccess?.();
      }}
    />
  );
};
