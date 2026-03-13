import { Star, Users, MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";

interface BoatCardProps {
  id?: string;
  image: string;
  name: string;
  capacity: number;
  location: string;
  pricePerDay: number;
  rating: number;
  index: number;
  reviewCount?: number;
}

const BoatCard = ({ id, image, name, capacity, location, pricePerDay, rating, index, reviewCount }: BoatCardProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = id ? isFavorite(id) : false;
  const cardContent = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="group bg-card rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-foreground">{rating}</span>
        </div>
        {id && (
          <button
            type="button"
            aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(id);
            }}
            className="absolute top-3 left-3 rounded-full bg-card/90 backdrop-blur-sm p-1.5 transition-colors hover:bg-card"
          >
            <Heart
              className={`h-4 w-4 transition-colors ${
                favorited ? "fill-rose-500 text-rose-500" : "text-muted-foreground"
              }`}
            />
          </button>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading font-semibold text-foreground text-lg mb-1">{name}</h3>
        <div className="flex items-center gap-3 text-muted-foreground text-sm mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {location}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {capacity} guests
          </span>
          {typeof reviewCount === "number" ? (
            <span className="text-xs">{reviewCount} reviews</span>
          ) : null}
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-heading font-bold text-foreground">€{pricePerDay}</span>
            <span className="text-sm text-muted-foreground"> / day</span>
          </div>
          {id ? (
            <Link to={`/boats/${id}`} className="text-sm font-medium text-aegean hover:text-turquoise transition-colors">
              View Boat →
            </Link>
          ) : (
            <button className="text-sm font-medium text-aegean hover:text-turquoise transition-colors">
              View Boat →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (!id) {
    return cardContent;
  }

  return (
    <Link to={`/boats/${id}`} aria-label={`View ${name} boat details`} className="block">
      {cardContent}
    </Link>
  );
};

export default BoatCard;
