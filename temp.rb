require 'pork/auto'
require 'muack'

describe 'Hello' do
  include Muack::API
  before{ Muack.reset  }
  after { Muack.verify }

  would 'puts' do
    mock(self).puts(is_a(String)){ok}
    ptus "Hello"
  end
end
