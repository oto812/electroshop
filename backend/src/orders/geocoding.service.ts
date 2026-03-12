import { Injectable } from "@nestjs/common";


@Injectable()
export class GeocodingService {
    async geocode(address: string): Promise<{ lat: number, lng: number }> {
        try {
            const encoded = encodeURIComponent(address);
            const response = await fetch(
                'https://nominatim.openstreetmap.org/search?format=json&q=${encoded}',
                {
                    headers: { 'User-Agent': 'Electroshop-MVP/1.0' },
                },
            );

            const data = await response.json();

            if(data && data.length > 0) {
                return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
            }

            return { lat: 0, lng: 0 };
        }catch {
            return { lat: 0, lng: 0 };
 
        }

    }
}