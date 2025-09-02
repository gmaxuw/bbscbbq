import { Flame, Award, Users, Clock } from 'lucide-react'

export default function AboutSection() {
  return (
    <section className="bbq-section bg-gradient-to-br from-gray-50 to-lays-dark-red/5">
      <div className="bbq-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center space-x-2 bg-lays-dark-red/10 text-lays-dark-red rounded-full px-4 py-2 mb-6">
              <Flame className="w-5 h-5" />
              <span className="font-medium text-sm">Our Story</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-bbq-display font-bold text-gray-900 mb-8">
              Crafting BBQ Excellence Since Day One
            </h2>
            
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              At Smoke & Fire BBQ, we believe that great BBQ isn't just about food—it's about 
              tradition, patience, and the perfect balance of smoke and fire. Our journey began 
              with a simple passion for authentic BBQ flavors and a commitment to quality that 
              never compromises.
            </p>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Every piece of meat that leaves our kitchen has been carefully selected, 
              expertly seasoned with our signature dry rub, and slow-smoked to perfection 
              using traditional methods passed down through generations.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl font-bold text-lays-dark-red mb-2">15+</div>
                <div className="text-sm text-gray-600">Years of Experience</div>
              </div>
              <div className="text-center p-4 bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300">
                <div className="text-3xl font-bold text-lays-dark-red mb-2">50K+</div>
                <div className="text-sm text-gray-600">Happy Customers</div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-lays-dark-red/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Award className="w-4 h-4 text-lays-dark-red" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-lays-dark-red transition-colors duration-200">Premium Quality Ingredients</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-lays-dark-red/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Clock className="w-4 h-4 text-lays-dark-red" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-lays-dark-red transition-colors duration-200">12+ Hours Slow Smoking</span>
              </div>
              <div className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-lays-dark-red/10 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <Users className="w-4 h-4 text-lays-dark-red" />
                </div>
                <span className="text-gray-700 font-medium group-hover:text-lays-dark-red transition-colors duration-200">Family-Owned & Operated</span>
              </div>
            </div>
          </div>

          {/* Image Grid */}
          <div className="relative animate-slide-up">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="h-48 bg-gradient-to-br from-lays-dark-red/20 to-lays-bright-red/20 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">🔥</span>
                </div>
                <div className="h-32 bg-gradient-to-br from-lays-orange-gold/20 to-lays-dark-red/20 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <span className="text-3xl">🥩</span>
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-32 bg-gradient-to-br from-lays-bright-red/20 to-lays-orange-gold/20 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <span className="text-3xl">🍖</span>
                </div>
                <div className="h-48 bg-gradient-to-br from-lays-dark-red/20 to-lays-bright-red/20 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
                  <span className="text-4xl">💨</span>
                </div>
              </div>
            </div>
            
            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-6 max-w-xs hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-lays-dark-red rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">⭐</span>
                </div>
                <div>
                  <div className="font-bold text-gray-900">Customer Favorite</div>
                  <div className="text-sm text-gray-600">Smoked Beef Brisket</div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                "The best BBQ I've ever tasted! The brisket melts in your mouth."
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
