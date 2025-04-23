import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db } from '../config/firebase';

interface ProfileImageResult {
  localUri: string;
  thumbnailUri: string;
  error: string | null;
}

interface UseProfileImageReturn {
  pickAndProcessImage: () => Promise<ProfileImageResult>;
  isLoading: boolean;
}

const THUMBNAIL_WIDTH = 100;

export const useProfileImage = (): UseProfileImageReturn => {
  const [isLoading, setIsLoading] = useState(false);

  const pickAndProcessImage = async (): Promise<ProfileImageResult> => {
    try {
      setIsLoading(true);

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return {
          localUri: '',
          thumbnailUri: '',
          error: 'Permission to access media library was denied',
        };
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (result.canceled) {
        return {
          localUri: '',
          thumbnailUri: '',
          error: 'Image selection was cancelled',
        };
      }

      const imageUri = result.assets[0].uri;

      // Save original image locally
      const localUri = `${FileSystem.documentDirectory}profile_${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: imageUri,
        to: localUri,
      });

      // Create thumbnail
      const manipResult = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: THUMBNAIL_WIDTH } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      // Save thumbnail locally
      const thumbnailUri = `${FileSystem.documentDirectory}profile_thumb_${Date.now()}.jpg`;
      await FileSystem.copyAsync({
        from: manipResult.uri,
        to: thumbnailUri,
      });

      return {
        localUri,
        thumbnailUri,
        error: null,
      };
    } catch (error) {
      console.error('Profile image processing error:', error);
      return {
        localUri: '',
        thumbnailUri: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    pickAndProcessImage,
    isLoading,
  };
}; 