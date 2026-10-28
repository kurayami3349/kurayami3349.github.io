# frozen_string_literal: true

require "open3"

Jekyll::Hooks.register :posts, :post_init do |post|
  next if post.data["last_modified_at"]

  # Pass paths as arguments so quotes and shell metacharacters stay literal.
  dates, _error, status = Open3.capture3(
    "git", "-C", post.site.source, "log", "-2", "--format=%aI", "--", post.path
  )
  next unless status.success?

  entries = dates.lines.map(&:strip)
  post.data["last_modified_at"] = entries.first if entries.length > 1
end
