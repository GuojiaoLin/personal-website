import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layout } from '../components/Layout';
import { X, Maximize2, Camera, MapPin, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { type GalleryPhotoRecord, listGalleryPhotos } from '../lib/adminApi';

interface Photo {
  id: string;
  url: string;
  title: string;
  description: string;
  location: string;
  date: string;
  aspectRatio: string;
}

const galleryImageModules = import.meta.glob('../../docs/images/图册/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const aspectRatios = ['aspect-[4/5]', 'aspect-[1/1]', 'aspect-[3/4]', 'aspect-[16/10]', 'aspect-[5/4]', 'aspect-[2/3]', 'aspect-[4/3]'];

const hashPath = (path: string) => (
  Array.from(path).reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0)
);

const fileNameFromPath = (path: string) => path.split('/').pop() ?? path;

const galleryPlacements: Record<string, number> = {
  '微信图片_20260509190303.jpg': 0,
  '微信图片_20260509190325.jpg': 7,
  '微信图片_20260509190428.jpg': 11,
  '微信图片_20260529170514.jpg': 15,
  '微信图片_20260509190432.jpg': 16,
  '微信图片_20260509190439.jpg': 21,
};

const moveFileToIndex = (
  entries: Array<[string, string]>,
  fileName: string,
  targetIndex: number
) => {
  const currentIndex = entries.findIndex(([path]) => fileNameFromPath(path) === fileName);
  if (currentIndex === -1) return;

  const [entry] = entries.splice(currentIndex, 1);
  entries.splice(Math.min(targetIndex, entries.length), 0, entry);
};

const orderedGalleryEntries = Object.entries(galleryImageModules).sort(([a], [b]) => hashPath(a) - hashPath(b));

Object.entries(galleryPlacements)
  .sort(([, a], [, b]) => a - b)
  .forEach(([fileName, targetIndex]) => moveFileToIndex(orderedGalleryEntries, fileName, targetIndex));

const photoDetails = [
  { title: '屋檐小太阳', description: '仰头遇见一只小太阳，黑白色也能把春天照亮。', date: '2020' },
  { title: '夜桥旧梦', description: '夜色温柔，衣袂轻轻，像误入一场旧梦。', date: '2019' },
  { title: '泡泡橘猫', description: '泡泡、笑容和橘猫，都是今天最轻盈的快乐。', date: '2021' },
  { title: '屋顶春饮', description: '在屋顶喝一口春天，风也变得很甜。', date: '2022' },
  { title: '木箱晒猫', description: '晒太阳的小猫，连风都变得软乎乎。', date: '2020' },
  { title: '雪径白帽', description: '雪落成诗，白帽子里藏着一点可爱。', date: '2023' },
  { title: '花船远方', description: '花在近处，船在远方，风把日子吹成了蓝色。', date: '2021' },
  { title: '雪山披肩', description: '雪山把蓝天借给我，风把披肩吹成一首小诗。', date: '2024' },
  { title: '双猫午睡', description: '毛茸茸的梦靠在一起，今天的温柔有双份。', date: '2022' },
  { title: '森林光里', description: '坐在森林的光里，连发梢都沾上了温柔。', date: '2024' },
  { title: '云雾雪峰', description: '云雾替雪山写信，字字都是远方。', date: '2023' },
  { title: '蓝披肩山风', description: '把山风披在身上，今天是会飞的蓝色。', date: '2024' },
  { title: '粉枝春甜', description: '粉色花开满枝头，春天一下子变得甜甜的。', date: '2019' },
  { title: '冬日举高高', description: '把冬天抱进怀里，也把快乐举高高。', date: '2021' },
  { title: '掌心小花', description: '捧住一朵小小花，也捧住了阳光落下的瞬间。', date: '2020' },
  { title: '圆眼小猫', description: '一双圆圆眼睛，把世界看得亮晶晶。', date: '2022' },
  { title: '紫色花海', description: '紫色花海轻轻晃，像春天偷偷打翻了梦。', date: '2019' },
  { title: '樱花云朵', description: '樱花开成云朵，抬头就撞进粉色童话。', date: '2023' },
  { title: '草地光影', description: '阳光落在草地上，也落进了软乎乎的心情里。', date: '2020' },
  { title: '橘花向阳', description: '橘色小花朝着天空笑，今天的快乐很明亮。', date: '2021' },
  { title: '湖畔明信片', description: '蓝天、草地和湖水，拼成一张安静的明信片。', date: '2024' },
  { title: '草帽小猫', description: '今日份小猫戴帽营业：可爱满分，懒洋洋加倍。', date: '2019' },
  { title: '远山湖风', description: '湖边有风，远山不语，时间也变得慢悠悠。', date: '2022' },
  { title: '花影春风', description: '举起小相机，记录一场绿色的梦。', date: '2024' },
  { title: '生活切片 25', description: '树影轻轻晃，夏天也变得软软的。', date: '2024' },
] as const;

const fallbackPhotos: Photo[] = orderedGalleryEntries
  .map(([path, url], index) => {
    const detail = photoDetails[index] ?? {
      title: `生活切片 ${String(index + 1).padStart(2, '0')}`,
      description: '图册里自然生长的一帧日常。',
      date: '2024',
    };

    return {
      id: String(index + 1),
      url,
      title: detail.title,
      description: detail.description,
      location: '生活图册',
      date: detail.date,
      aspectRatio: aspectRatios[Math.abs(hashPath(path)) % aspectRatios.length],
    };
  });

const getGalleryRecordDisplayKey = (photo: GalleryPhotoRecord) => [
  photo.url,
  photo.title,
  photo.description,
  photo.location,
  photo.takenAt,
].join('|');

const photoFromGalleryRecord = (photo: GalleryPhotoRecord): Photo => {
  const displayKey = getGalleryRecordDisplayKey(photo);

  return {
    id: photo.id,
    url: photo.url,
    title: photo.title,
    description: photo.description,
    location: photo.location || '生活图册',
    date: photo.takenAt || '2024',
    aspectRatio: aspectRatios[Math.abs(hashPath(displayKey)) % aspectRatios.length],
  };
};

const galleryShuffleSalt = 'photography-gallery-shuffle-v1';

const getGalleryShuffleKey = (photo: Photo) => [
  photo.url,
  photo.title,
  photo.description,
  photo.location,
  photo.date,
  photo.aspectRatio,
].join('|');

const shuffleGalleryPhotos = (items: Photo[]) => {
  return items
    .map((photo) => ({
      photo,
      score: Math.abs(hashPath(`${getGalleryShuffleKey(photo)}|${galleryShuffleSalt}`)),
    }))
    .sort((a, b) => (
      a.score === b.score
        ? getGalleryShuffleKey(a.photo).localeCompare(getGalleryShuffleKey(b.photo))
        : a.score - b.score
    ))
    .map(({ photo }) => photo);
};

const getGalleryColumnCount = () => {
  if (typeof window === 'undefined') return 3;
  if (window.matchMedia('(min-width: 1024px)').matches) return 3;
  if (window.matchMedia('(min-width: 640px)').matches) return 2;
  return 1;
};

const aspectRatioLayoutWeights: Record<string, number> = {
  'aspect-[16/10]': 0.625,
  'aspect-[4/3]': 0.75,
  'aspect-[5/4]': 0.8,
  'aspect-[1/1]': 1,
  'aspect-[4/5]': 1.25,
  'aspect-[3/4]': 1.33,
  'aspect-[2/3]': 1.5,
};

const getPhotoLayoutWeight = (photo: Photo) => aspectRatioLayoutWeights[photo.aspectRatio] ?? 1;

const getShortestGalleryColumnIndex = (columnHeights: number[]) => (
  columnHeights.reduce((shortestIndex, height, index) => (
    height < columnHeights[shortestIndex] ? index : shortestIndex
  ), 0)
);

const distributePhotos = (items: Photo[], columnCount: number) => {
  if (columnCount <= 0) return [];

  const columns = Array.from({ length: columnCount }, () => [] as Photo[]);
  const columnHeights = Array.from({ length: columnCount }, () => 0);

  items.forEach((photo) => {
    const columnIndex = getShortestGalleryColumnIndex(columnHeights);
    columns[columnIndex].push(photo);
    columnHeights[columnIndex] += getPhotoLayoutWeight(photo);
  });

  return columns;
};

const PhotoCard = ({
  photo,
  onSelect,
}: {
  photo: Photo;
  onSelect: (photo: Photo) => void;
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    whileHover={{
      y: -8,
      boxShadow: "0 8px 24px rgba(255, 255, 0, 0.16)",
      borderColor: "#FFFF00"
    }}
    className="relative group cursor-pointer rounded-[20px] overflow-hidden border border-slate-100 shadow-md shadow-slate-200/40 transition-all duration-300"
    onClick={() => onSelect(photo)}
  >
    <div className={`overflow-hidden relative ${photo.aspectRatio}`}>
      <img
        src={photo.url}
        alt={photo.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
        <h3 className="text-[#FFFF00] font-black text-xl mb-1 group-hover:scale-105 transition-transform">{photo.title}</h3>
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <MapPin className="w-4 h-4 text-[#FFFF00]" />
          <span>{photo.location}</span>
        </div>
      </div>
    </div>
    <div className="absolute top-5 right-5 bg-[#FFFF00] p-2.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all transform scale-75 group-hover:scale-100 group-hover:rotate-12">
      <Maximize2 className="text-black w-4 h-4" />
    </div>
  </motion.div>
);

const Photography = () => {
  const [photos, setPhotos] = useState<Photo[]>(() => shuffleGalleryPhotos(fallbackPhotos));
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [columnCount, setColumnCount] = useState(getGalleryColumnCount);
  const photoColumns = distributePhotos(photos, columnCount);

  useEffect(() => {
    let isCurrent = true;

    listGalleryPhotos()
      .then((galleryPhotos) => {
        if (!isCurrent || galleryPhotos.length === 0) return;
        setPhotos(shuffleGalleryPhotos(galleryPhotos.map(photoFromGalleryRecord)));
      })
      .catch(() => {
        if (isCurrent) setPhotos(shuffleGalleryPhotos(fallbackPhotos));
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getGalleryColumnCount());
    updateColumnCount();
    window.addEventListener('resize', updateColumnCount);
    return () => window.removeEventListener('resize', updateColumnCount);
  }, []);

  return (
    <Layout>
      <section className="pt-16 pb-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="h-10 mb-5 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center space-x-2 text-black bg-[#FFFF00] px-3.5 py-1.5 rounded-full shadow-sm shadow-[#FFFF00]/20"
            >
              <Camera className="w-4 h-4" />
              <span className="font-black tracking-widest uppercase text-[10px]">Photography Gallery</span>
            </motion.div>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">镜头下的 <span className="text-[#FFFF00]">时光</span></h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed">
            留意生活里的小瞬间，光影起落，心事与时光都藏在照片里。
          </p>
        </div>

        <div
          className="mx-auto grid max-w-5xl items-start gap-5"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
        >
          {photoColumns.map((column, columnIndex) => (
            <div key={columnIndex} className="space-y-5">
              {column.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onSelect={setSelectedPhoto}
                />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox / Immersive Preview */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-white/90 backdrop-blur-2xl"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl lg:h-[68vh] lg:max-h-[640px] flex flex-col lg:flex-row gap-0 bg-white rounded-[28px] overflow-hidden shadow-[0_24px_56px_-18px_rgba(0,0,0,0.12)] border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative h-[42vh] min-h-[280px] overflow-hidden bg-slate-50 lg:h-full lg:min-h-0 lg:basis-[56%]">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.title}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
              
              <div className="relative flex flex-col justify-center bg-white p-6 md:p-10 lg:basis-[44%] lg:overflow-y-auto">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="absolute top-6 right-6 text-slate-900 hover:bg-slate-100 rounded-xl w-10 h-10"
                  onClick={() => setSelectedPhoto(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
                
                <div className="inline-block w-10 h-1 bg-[#FFFF00] mb-6" />
                <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">{selectedPhoto.title}</h2>
                <p className="text-slate-700 text-xl md:text-2xl mb-6 leading-relaxed font-semibold italic">
                  "{selectedPhoto.description}"
                </p>
                
                <div className="flex flex-wrap items-center gap-3 pt-5 border-t border-slate-100">
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-[#FFFF00]" />
                    </div>
                    <span>{selectedPhoto.location}</span>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-slate-500 font-bold">
                    <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5 text-[#FFFF00]" />
                    </div>
                    <span>{selectedPhoto.date}</span>
                  </div>
                </div>

                <div className="mt-8 pt-5 flex items-center justify-between border-t border-slate-50">
                  <span className="text-[10px] text-slate-400 font-black tracking-[0.2em] uppercase">
                    Captured with Passion • {selectedPhoto.date}
                  </span>
                  <div className="w-2 h-2 bg-[#FFFF00] rounded-full" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
};

export default Photography;
