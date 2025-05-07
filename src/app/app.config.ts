import {ApplicationConfig, importProvidersFrom, provideZoneChangeDetection} from '@angular/core';

import {provideHttpClient} from '@angular/common/http';
import {icons, LucideAngularModule} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideHttpClient()]
};
