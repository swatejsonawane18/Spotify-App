/* eslint-disable */
import * as Router from 'expo-router';

export * from 'expo-router';

declare module 'expo-router' {
  export namespace ExpoRouter {
    export interface __routes<T extends string | object = string> {
      hrefInputParams: { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/camera`; params?: Router.UnknownInputParams; } | { pathname: `/comment`; params?: Router.UnknownInputParams; } | { pathname: `/search`; params?: Router.UnknownInputParams; } | { pathname: `/user`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/signup` | `/signup`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/empty` | `/empty`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/friends` | `/friends`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/inbox` | `/inbox`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams; } | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } };
      hrefOutputParams: { pathname: Router.RelativePathString, params?: Router.UnknownOutputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownOutputParams } | { pathname: `/camera`; params?: Router.UnknownOutputParams; } | { pathname: `/comment`; params?: Router.UnknownOutputParams; } | { pathname: `/search`; params?: Router.UnknownOutputParams; } | { pathname: `/user`; params?: Router.UnknownOutputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(auth)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(auth)'}/signup` | `/signup`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/empty` | `/empty`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/friends` | `/friends`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/inbox` | `/inbox`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownOutputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownOutputParams; } | { pathname: `/+not-found`, params: Router.UnknownOutputParams & {  } };
      href: Router.RelativePathString | Router.ExternalPathString | `/camera${`?${string}` | `#${string}` | ''}` | `/comment${`?${string}` | `#${string}` | ''}` | `/search${`?${string}` | `#${string}` | ''}` | `/user${`?${string}` | `#${string}` | ''}` | `/_sitemap${`?${string}` | `#${string}` | ''}` | `${'/(auth)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(auth)'}/signup${`?${string}` | `#${string}` | ''}` | `/signup${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/empty${`?${string}` | `#${string}` | ''}` | `/empty${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/friends${`?${string}` | `#${string}` | ''}` | `/friends${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/inbox${`?${string}` | `#${string}` | ''}` | `/inbox${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}${`?${string}` | `#${string}` | ''}` | `/${`?${string}` | `#${string}` | ''}` | `${'/(tabs)'}/profile${`?${string}` | `#${string}` | ''}` | `/profile${`?${string}` | `#${string}` | ''}` | { pathname: Router.RelativePathString, params?: Router.UnknownInputParams } | { pathname: Router.ExternalPathString, params?: Router.UnknownInputParams } | { pathname: `/camera`; params?: Router.UnknownInputParams; } | { pathname: `/comment`; params?: Router.UnknownInputParams; } | { pathname: `/search`; params?: Router.UnknownInputParams; } | { pathname: `/user`; params?: Router.UnknownInputParams; } | { pathname: `/_sitemap`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(auth)'}/signup` | `/signup`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/empty` | `/empty`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/friends` | `/friends`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/inbox` | `/inbox`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}` | `/`; params?: Router.UnknownInputParams; } | { pathname: `${'/(tabs)'}/profile` | `/profile`; params?: Router.UnknownInputParams; } | `/+not-found` | { pathname: `/+not-found`, params: Router.UnknownInputParams & {  } };
    }
  }
}
