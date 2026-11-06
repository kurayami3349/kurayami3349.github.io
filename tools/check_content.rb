# frozen_string_literal: true

require "date"
require "yaml"

errors = []
published_urls = []
Dir.glob("_posts/*.md").each do |path|
  match = File.read(path).match(/\A---\s*\n(.*?)\n---\s*\n/m)
  unless match
    errors << "#{path}: missing front matter"
    next
  end
  begin
    data = YAML.safe_load(match[1], permitted_classes: [Date, Time])
    raise "front matter must be a mapping" unless data.is_a?(Hash)
    next if data["published"] == false
    slug = data["slug"] || File.basename(path, ".md").sub(/\A\d{4}-\d{2}-\d{2}-/, "")
    published_urls << (data["permalink"] || "/posts/#{slug}/")

    %w[title description].each do |key|
      value = data[key]
      if !value.is_a?(String) || value.strip.empty? || value.match?(/\A(?:TITLE|待添加文章描述|Short summary of the post\.)\z/)
        errors << "#{path}: complete #{key} before publishing"
      end
    end
    tags = data["tags"]
    unless tags.is_a?(Array) && !tags.empty? && tags.all? { |tag| tag.is_a?(String) && !tag.strip.empty? && !%w[TAG 待设置].include?(tag) }
      errors << "#{path}: add real tags before publishing"
    end
  rescue StandardError => error
    errors << "#{path}: #{error.message}"
  end
end
topics = YAML.safe_load(File.read("_data/topics.yml"))
topic_ids = topics.map { |topic| topic["id"] }
errors << "Topic IDs must be unique" unless topic_ids.uniq == topic_ids
topics.each do |topic|
  urls = topic.fetch("steps").map { |step| step.fetch("url") }
  errors << "#{topic['id']}: repeated reading step" unless urls.uniq == urls
  (urls - published_urls).each do |url|
    errors << "#{topic['id']}: reading path references an unpublished or missing post: #{url}"
  end
end
abort errors.join("\n") unless errors.empty?
puts "Published post metadata and topic references are complete."
