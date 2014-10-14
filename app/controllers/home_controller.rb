class HomeController < ApplicationController
  def index
    # Nothing lol
  end

  def search
    @postal_code = params[:postal_code]
    if isValidPostalCode?(@postal_code)
      parameters = {
        term: "resturants",
        sort: 2, #Highest Rated
      }
      response = Yelp.client.search(@postal_code, parameters)
      render json: formatYelpResponse(response)
    end
  end

  def isValidPostalCode?( postal_code )
    if postal_code.match(/^\d{5}$/)
      true #American
    elsif postal_code.match(/^([a-zA-z]\d){3}$/)
      true #Canadian
    else
      false
    end
  end

  def formatYelpResponse( response )
    if response.total == 0
      return {
        :status => "error",
        :message => "Nothing nearby! :("
      }
    end

    # List of category aliases
    # DZ: Might want to redo this, so that each element is a link between category and alias
    categories = response.businesses.map{ |business|
      business.categories.map{ |category| category.last }
    }

    # Read response data and hang the businesses by categories
    businesses = {}
    response.businesses.each_with_index do |business, index|
      next if business.is_closed
      business.categories.each do |category|
        businesses["#{category.first}"] ||= []
        businesses["#{category.first}"] << response.businesses[index]
      end
    end

    return {
      :status => "success",
      :message => "",
      :total => response.total,
      :region => response.region,
      :businesses => businesses,
      :categories => categories,
    }
  end
end