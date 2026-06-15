package com.guojiaolin.website.common;

import java.util.List;

public record ListResponse<T>(List<T> items) {
}
